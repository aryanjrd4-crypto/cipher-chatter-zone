import { createClient } from "npm:@supabase/supabase-js@2";
import { BACKUP_FIELDS, BACKUP_FORMAT, BACKUP_VERSION, IMPORT_ORDER, MAX_BACKUP_BYTES, validateBackup } from "./backup-format.ts";

const PAGE_SIZE = 1000;
const IMPORT_BATCH_SIZE = 250;

const ALLOWED_ORIGINS = new Set([
  "https://cipher-chatter-zone.lovable.app",
  "https://id-preview--aa58764d-f897-43e6-9f24-b5c1a3aa2cc2.lovable.app",
  "http://localhost:8080",
]);

function jsonResponse(status: number, value: unknown, origin: string) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(value), { status, headers });
}

function orderParentsFirst(table: string, rows: Record<string, unknown>[]) {
  if (table !== "comments" && table !== "chat_messages") return rows;
  const rowsById = new Map(rows.map((row) => [String(row.id), row]));
  const remaining = new Set(rows);
  const ordered: Record<string, unknown>[] = [];
  while (remaining.size > 0) {
    let addedParent = false;
    for (const row of [...remaining]) {
      const parentId = typeof row.parent_id === "string" ? row.parent_id : "";
      const parent = parentId ? rowsById.get(parentId) : undefined;
      if (!parent || !remaining.has(parent)) {
        ordered.push(row);
        remaining.delete(row);
        addedParent = true;
      }
    }
    if (!addedParent) {
      ordered.push(...remaining);
      break;
    }
  }
  return ordered;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") {
    if (!ALLOWED_ORIGINS.has(origin)) return new Response("Not allowed", { status: 403 });
    return jsonResponse(200, { ok: true }, origin);
  }
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, origin);
  if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse(403, { error: "This address is not allowed." }, origin);
  const declaredSize = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_BACKUP_BYTES + 128 * 1024) {
    return jsonResponse(413, { error: "This backup is larger than the 15 MB upload limit." }, origin);
  }

  const authorization = req.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return jsonResponse(401, { error: "Admin sign-in is required." }, origin);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return jsonResponse(503, { error: "Backups are temporarily unavailable." }, origin);

    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user || userData.user.email?.toLowerCase() !== "aryanjrd4@gmail.com") {
      return jsonResponse(403, { error: "Approved admin access is required." }, origin);
    }
    const { data: isAdmin, error: roleError } = await caller.rpc("is_admin");
    if (roleError || isAdmin !== true) return jsonResponse(403, { error: "Approved admin access is required." }, origin);

    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || (body.operation !== "export" && body.operation !== "import")) {
      return jsonResponse(400, { error: "Choose a valid backup action." }, origin);
    }

    if (body.operation === "export") {
      const data: Record<string, unknown[]> = {};
      for (const table of Object.keys(BACKUP_FIELDS)) {
        const rows: unknown[] = [];
        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data: page, error } = await service.from(table).select("*").order("id").range(offset, offset + PAGE_SIZE - 1);
          if (error) return jsonResponse(500, { error: "The backup could not be completed. No file was created." }, origin);
          rows.push(...(page ?? []));
          if ((page ?? []).length < PAGE_SIZE) break;
          if (rows.length >= 25000) return jsonResponse(413, { error: "A data section is larger than the current backup limit. No partial backup was created." }, origin);
        }
        data[table] = rows;
      }
      const backup = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exported_at: new Date().toISOString(), data };
      if (new TextEncoder().encode(JSON.stringify(backup)).byteLength > MAX_BACKUP_BYTES) {
        return jsonResponse(413, { error: "This backup is larger than the 15 MB download limit. No partial backup was created." }, origin);
      }
      return jsonResponse(200, { backup }, origin);
    }

    const backupBytes = new TextEncoder().encode(JSON.stringify(body.backup)).byteLength;
    if (backupBytes > MAX_BACKUP_BYTES) return jsonResponse(413, { error: "This backup is larger than the 15 MB upload limit." }, origin);
    const validation = validateBackup(body.backup);
    if (!validation.data) return jsonResponse(400, { error: validation.error }, origin);

    const restored: Record<string, number> = {};
    for (const table of IMPORT_ORDER) {
      const rows = orderParentsFirst(table, validation.data[table] ?? []);
      let inserted = 0;
      for (let index = 0; index < rows.length; index += IMPORT_BATCH_SIZE) {
        const batch = rows.slice(index, index + IMPORT_BATCH_SIZE).map((row) =>
          Object.fromEntries(Object.entries(row).filter(([key]) => BACKUP_FIELDS[table].includes(key)))
        );
        const { data: saved, error } = await service.from(table).upsert(batch, { onConflict: "id", ignoreDuplicates: true }).select("id");
        if (error) return jsonResponse(500, { error: `Restore stopped while importing ${table}. Some earlier sections may already have been added; retrying this same file is safe.` }, origin);
        inserted += saved?.length ?? 0;
      }
      if (rows.length > 0) restored[table] = inserted;
    }

    return jsonResponse(200, { restored }, origin);
  } catch {
    return jsonResponse(500, { error: "The backup action could not be completed." }, origin);
  }
});