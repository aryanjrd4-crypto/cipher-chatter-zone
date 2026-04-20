import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TokenResult {
  token: string;
  url: string;
}

export function useLiveKitToken(opts: {
  room: string | null;
  identity: string;
  enabled?: boolean;
}) {
  const { room, identity, enabled = true } = opts;
  const [data, setData] = useState<TokenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!room || !enabled) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: res, error: fnErr } = await supabase.functions.invoke(
          'livekit-token',
          { body: { room, identity, name: `Cipher#${identity.slice(0, 4)}` } },
        );
        if (cancelled) return;
        if (fnErr) throw fnErr;
        if (!res?.token || !res?.url) throw new Error('Invalid token response');
        setData({ token: res.token as string, url: res.url as string });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to fetch token');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [room, identity, enabled]);

  return { data, error, loading };
}
