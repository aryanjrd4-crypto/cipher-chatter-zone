import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hash, Volume2, VolumeX } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatRoomSidebar } from '@/components/chat/ChatRoomSidebar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { usePreferencesStore, playBlip } from '@/stores/usePreferencesStore';
import { useRoomPresence } from '@/hooks/useRoomPresence';
import { useReadReceipts } from '@/hooks/useReadReceipts';
import { toast } from 'sonner';

export default function ChatPage() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const { soundEnabled, toggleSound } = usePreferencesStore();
  const queryClient = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('chat_rooms').select('*').eq('is_active', true).order('created_at');
      return data || [];
    },
  });

  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) setActiveRoom(rooms[0].id);
  }, [rooms, activeRoom]);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', activeRoom],
    queryFn: async () => {
      if (!activeRoom) return [];
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoom)
        .order('created_at', { ascending: true })
        .limit(100);
      return data || [];
    },
    enabled: !!activeRoom,
  });

  // Realtime
  useEffect(() => {
    if (!activeRoom) return;
    const channel = supabase
      .channel(`room-${activeRoom}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeRoom] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom, queryClient]);

  // Auto-scroll + sound on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      const last = messages[messages.length - 1];
      if (last && last.anonymous_id !== anonymousId) playBlip('received');
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, anonymousId]);

  // Presence + typing
  const { onlineCount, typingUsers, setTyping } = useRoomPresence(activeRoom);

  // Read receipts
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);
  const { readsByMessage, markAsRead } = useReadReceipts(activeRoom, messageIds);

  useEffect(() => {
    const others = messages.filter((m) => m.anonymous_id !== anonymousId).map((m) => m.id);
    if (others.length > 0) markAsRead(others);
  }, [messages, anonymousId]);

  const sendMessage = async (content: string, opts: { effect: string | null; imageUrl: string | null }) => {
    if (!activeRoom || (!content && !opts.imageUrl)) return;
    const { error } = await supabase.from('chat_messages').insert({
      room_id: activeRoom,
      anonymous_id: anonymousId,
      content: content || '',
      parent_id: replyTo,
      has_effect: opts.effect,
      image_url: opts.imageUrl,
    });
    if (error) {
      toast.error('Failed to send message');
    } else {
      setReplyTo(null);
      playBlip('sent');
    }
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id).eq('anonymous_id', anonymousId);
    queryClient.invalidateQueries({ queryKey: ['chat-messages', activeRoom] });
  };

  const activeRoomName = rooms.find((r) => r.id === activeRoom)?.name || 'Chat';
  const replyMessage = replyTo ? messages.find((m) => m.id === replyTo) : null;

  return (
    <Layout wide>
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        {/* Mobile room selector */}
        <div className="md:hidden flex gap-2 absolute top-[70px] left-4 right-4 z-10 overflow-x-auto pb-2 scrollbar-none">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeRoom === room.id ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Hash className="h-3 w-3" />
              {room.name}
            </button>
          ))}
        </div>

        <ChatRoomSidebar rooms={rooms} activeRoom={activeRoom} onSelectRoom={setActiveRoom} onlineCount={onlineCount} />

        <div className="flex-1 flex flex-col glass-strong rounded-xl overflow-hidden min-w-0">
          {/* Room header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40">
            <Hash className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground tracking-tight">{activeRoomName}</h2>
            <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_hsl(150,80%,50%,0.6)] animate-pulse" />
              <span className="tabular-nums">{onlineCount} online</span>
            </div>
            <button
              onClick={toggleSound}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary/60"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
            {messages.length === 0 && <ChatEmptyState />}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                content={msg.content}
                anonymousId={msg.anonymous_id}
                createdAt={msg.created_at}
                parentContent={msg.parent_id ? messages.find((m) => m.id === msg.parent_id)?.content : undefined}
                hasEffect={msg.has_effect}
                imageUrl={(msg as any).image_url}
                readCount={readsByMessage[msg.id] || 0}
                onReply={setReplyTo}
                onDelete={deleteMessage}
              />
            ))}
            {typingUsers.length > 0 && <TypingIndicator count={typingUsers.length} />}
          </div>

          <ChatInput
            onSend={sendMessage}
            onTyping={setTyping}
            replyPreview={replyMessage ? { content: replyMessage.content } : null}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>
    </Layout>
  );
}
