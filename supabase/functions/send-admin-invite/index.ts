import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ADMIN_EMAIL = "aryanjrd4@gmail.com";
const ALLOWED_ORIGINS = new Set([
  "https://cipher-chatter-zone.lovable.app",
  "https://id-preview--aa58764d-f897-43e6-9f24-b5c1a3aa2cc2.lovable.app",
  "http://localhost:8080",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const serviceUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Admin setup is temporarily unavailable." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerKey = req.headers.get("apikey");
    if (!callerKey || callerKey !== Deno.env.get("SUPABASE_ANON_KEY")) {
      return new Response(JSON.stringify({ error: "Admin setup is unavailable." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(serviceUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const origin = req.headers.get("origin") || "";
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "Admin setup is unavailable from this address." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: reserved, error: reserveError } = await admin.rpc("reserve_admin_invite");
    if (reserveError) throw reserveError;
    if (!reserved) {
      return new Response(JSON.stringify({ error: "A setup email was sent recently. Please wait 10 minutes before requesting another." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(ADMIN_EMAIL, {
      redirectTo: `${origin}/admin/set-password`,
    });
    if (error) {
      const safeMessage = `${error.message} ${error.code || ''}`.toLowerCase();
      const alreadyExists = safeMessage.includes("already") || safeMessage.includes("registered") || safeMessage.includes("exists");
      return new Response(JSON.stringify({
        error: alreadyExists
          ? "An admin account already exists. Sign in with its password or use the account recovery link."
          : "The setup email could not be sent. Please try again later.",
      }), {
        status: alreadyExists ? 409 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "The setup email could not be sent. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});