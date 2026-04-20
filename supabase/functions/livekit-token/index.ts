// Mints a short-lived LiveKit access token for an anonymous participant.
// No JWT auth — Cipher is fully anonymous. We just sign join grants for a given
// (room, identity) pair so the LiveKit SDK can connect over WebSocket.
//
// Required env (already set in Lovable Cloud secrets):
//   - LIVEKIT_URL          (wss://your-project.livekit.cloud)
//   - LIVEKIT_API_KEY      (API key from LiveKit Cloud → Settings → Keys)
//   - LIVEKIT_API_SECRET   (the matching secret)
import { AccessToken } from "npm:livekit-server-sdk@2.7.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  room: string;
  identity: string;
  name?: string;
  canPublishVideo?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("LIVEKIT_URL");
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!url || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "LiveKit credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    if (!body?.room || !body?.identity) {
      return new Response(
        JSON.stringify({ error: "room and identity are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const room = String(body.room).slice(0, 80);
    const identity = String(body.identity).slice(0, 64);
    const name = body.name ? String(body.name).slice(0, 32) : `Cipher#${identity.slice(0, 4)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: 60 * 60, // 1 hour
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // Audio is always allowed; video gated by client request
    });

    const token = await at.toJwt();

    return new Response(JSON.stringify({ token, url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("livekit-token error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
