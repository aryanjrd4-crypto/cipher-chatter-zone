import { motion } from 'framer-motion';
import { Hash, Users } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  description: string | null;
}

interface ChatRoomSidebarProps {
  rooms: Room[];
  activeRoom: string | null;
  onSelectRoom: (id: string) => void;
  onlineCount: number;
}

export function ChatRoomSidebar({ rooms, activeRoom, onSelectRoom, onlineCount }: ChatRoomSidebarProps) {
  return (
    <div className="w-64 shrink-0 glass-strong rounded-xl p-3 space-y-4 hidden md:block">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="h-3 w-3" />
          <span>{onlineCount}</span>
        </div>
      </div>
      <div className="space-y-1">
        {rooms.map((room) => (
          <motion.button
            key={room.id}
            whileHover={{ x: 2 }}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeRoom === room.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            <Hash className="h-4 w-4 shrink-0" />
            <div className="text-left">
              <div className="font-medium">{room.name}</div>
              {room.description && (
                <div className="text-[10px] text-muted-foreground/70 truncate">{room.description}</div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
