const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function parseTimestamp(dateStr: string | null | undefined): number | null {
  if (!dateStr || !dateStr.trim()) return null;
  const value = new Date(dateStr).getTime();
  return Number.isFinite(value) ? value : null;
}

export function formatMessageTimestamp(dateStr: string | null | undefined, now = Date.now()): string {
  const timestamp = parseTimestamp(dateStr);
  if (timestamp === null) return 'Time unavailable';

  const age = now - timestamp;
  if (age >= DAY) {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(timestamp).replace(',', ',');
  }
  if (age < 0) return 'Just now';
  if (age < MINUTE) return 'Just now';
  const minutes = Math.floor(age / MINUTE);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(age / HOUR);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}

/** Compatibility alias for existing post/comment/activity timestamp displays. */
export const formatDistanceToNow = formatMessageTimestamp;

/** Updates the rendered label exactly when it crosses its next minute/hour/day boundary. */
export function useMessageTimestampRefresh(dateStr: string | null | undefined): number {
  const timestamp = parseTimestamp(dateStr);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (timestamp === null) return;
    const age = now - timestamp;
    const nextBoundary = age >= DAY
      ? Number.POSITIVE_INFINITY
      : age < 0
        ? timestamp
        : age < MINUTE
          ? timestamp + MINUTE
          : age < HOUR
            ? timestamp + (Math.floor(age / MINUTE) + 1) * MINUTE
            : timestamp + (Math.floor(age / HOUR) + 1) * HOUR;

    const delay = Number.isFinite(nextBoundary) ? Math.max(50, nextBoundary - Date.now() + 50) : DAY;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(delay, DAY));
    return () => window.clearTimeout(timer);
  }, [timestamp, now]);

  return now;
}

import { useEffect, useState } from 'react';