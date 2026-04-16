interface AnonAvatarProps {
  id: string;
  size?: number;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const GRADIENTS = [
  ['hsl(190, 95%, 55%)', 'hsl(270, 80%, 65%)'],
  ['hsl(270, 80%, 65%)', 'hsl(330, 85%, 60%)'],
  ['hsl(190, 95%, 55%)', 'hsl(330, 85%, 60%)'],
  ['hsl(160, 80%, 50%)', 'hsl(190, 95%, 55%)'],
  ['hsl(330, 85%, 60%)', 'hsl(30, 90%, 55%)'],
  ['hsl(200, 90%, 50%)', 'hsl(250, 85%, 60%)'],
];

export function AnonAvatar({ id, size = 32 }: AnonAvatarProps) {
  const hash = hashCode(id);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const initials = id.slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white/90 shrink-0 shadow-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        fontSize: size * 0.35,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  );
}
