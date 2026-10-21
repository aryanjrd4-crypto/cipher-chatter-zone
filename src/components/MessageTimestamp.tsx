import { formatMessageTimestamp, useMessageTimestampRefresh } from '@/lib/time';

interface MessageTimestampProps {
  date: string | null | undefined;
  className?: string;
}

export function MessageTimestamp({ date, className }: MessageTimestampProps) {
  const now = useMessageTimestampRefresh(date);
  return <time dateTime={date ?? undefined} className={className}>{formatMessageTimestamp(date, now)}</time>;
}