import { useMemo } from 'react';

interface Props {
  id: string;
  size?: number;
  className?: string;
  pulse?: boolean;
}

// Deterministic dual-color gradient blob fallback shown when a participant
// has their camera off. Mirrors AnonAvatar style but at any size.
const GRADIENTS: [string, string][] = [
  ['hsl(190, 95%, 55%)', 'hsl(270, 80%, 65%)'],
  ['hsl(270, 80%, 65%)', 'hsl(330, 85%, 60%)'],
  ['hsl(190, 95%, 55%)', 'hsl(330, 85%, 60%)'],
  ['hsl(160, 80%, 50%)', 'hsl(190, 95%, 55%)'],
  ['hsl(330, 85%, 60%)', 'hsl(30, 90%, 55%)'],
  ['hsl(200, 90%, 50%)', 'hsl(250, 85%, 60%)'],
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function CipherAvatar({ id, size = 96, className = '', pulse = false }: Props) {
  const gradient = useMemo(() => GRADIENTS[hash(id) % GRADIENTS.length], [id]);
  const initials = id.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '··';

  return (
    <div
      className={`relative rounded-full flex items-center justify-center font-bold text-white/90 shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${gradient[0]}, ${gradient[1]} 70%)`,
        fontSize: size * 0.32,
        letterSpacing: '0.05em',
        boxShadow: `0 0 ${size * 0.25}px ${gradient[0]}55`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 70%, rgba(255,255,255,0.4), transparent 50%)',
        }}
      />
      <span className="relative z-10 font-mono">{initials}</span>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ boxShadow: `0 0 0 2px ${gradient[0]}80` }}
        />
      )}
    </div>
  );
}
