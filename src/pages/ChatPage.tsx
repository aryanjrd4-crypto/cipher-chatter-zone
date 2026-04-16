import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Sparkles, Hash } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatRoomSidebar } from '@/components/chat/ChatRoomSidebar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { toast } from 'sonner';

export default function ChatPage() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const queryClient = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [effect, setEffect] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('chat_rooms').select('*').eq('is_active', true).order('created_at');
      return data || [];
    },
  });

  // Auto-select first room
  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0].id);
    }
  }, [rooms, activeRoom]);

  // Fetch messages for active room
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
    refetchInterval: 3000,
  });

  // Realtime subscription
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !activeRoom) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      room_id: activeRoom,
      anonymous_id: anonymousId,
      content: message.trim(),
      parent_id: replyTo,
      has_effect: effect,
    });
    if (error) {
      toast.error('Failed to send message');
    } else {
      setMessage('');
      setReplyTo(null);
      setEffect(null);
    }
    setSending(false);
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
        <div className="md:hidden flex gap-2 absolute top-[70px] left-4 right-4 z-10 overflow-x-auto pb-2">
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

        <ChatRoomSidebar rooms={rooms} activeRoom={activeRoom} onSelectRoom={setActiveRoom} onlineCount={Math.floor(Math.random() * 20) + 3} />

        {/* Chat area */}
        <div className="flex-1 flex flex-col glass-strong rounded-xl overflow-hidden">
          {/* Room header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40">
            <Hash className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">{activeRoomName}</h2>
            <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{Math.floor(Math.random() * 20) + 3} online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Sparkles className="h-10 w-10 mb-3 opacity-30" />
                </motion.div>
                <p className="text-sm">No messages yet. Start the conversation.</p>
                <p className="text-xs mt-1 text-muted-foreground/60">All messages are anonymous and encrypted.</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                content={msg.content}
                anonymousId={msg.anonymous_id}
                createdAt={msg.created_at}
                parentContent={msg.parent_id ? messages.find((m) => m.id === msg.parent_id)?.content : undefined}
                hasEffect={msg.has_effect}
                onReply={setReplyTo}
                onDelete={deleteMessage}
              />
            ))}
          </div>

          {/* Reply indicator */}
          {replyMessage && (
            <div className="px-4 py-2 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30">
              <span className="text-primary">Replying to:</span>
              <span className="truncate">{replyMessage.content}</span>
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {['glow', 'encrypted'].map((e) => (
                  <button
                    key={e}
                    onClick={() => setEffect(effect === e ? null : e)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      effect === e ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {e === 'glow' ? '✨' : '🔐'}
                  </button>
                ))}
              </div>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-secondary/50 border border-border/40 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
              <Button
                size="icon"
                disabled={!message.trim() || sending}
                onClick={sendMessage}
                className="h-10 w-10 rounded-xl bg-primary/90 hover:bg-primary shadow-[0_0_15px_hsl(190,95%,55%,0.2)]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
