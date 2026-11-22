export const BACKUP_FORMAT = "cipher-chatter-zone-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 15 * 1024 * 1024;
export const MAX_ROWS_PER_TABLE = 25000;

export const BACKUP_FIELDS: Record<string, string[]> = {
  posts: ["id", "anonymous_id", "title", "content", "category", "upvotes", "downvotes", "comment_count", "created_at", "updated_at", "view_count", "share_count"],
  comments: ["id", "post_id", "parent_id", "anonymous_id", "content", "upvotes", "downvotes", "created_at"],
  votes: ["id", "anonymous_id", "post_id", "comment_id", "vote_type", "created_at"],
  reactions: ["id", "post_id", "comment_id", "anonymous_id", "emoji", "created_at"],
  bookmarks: ["id", "anonymous_id", "post_id", "created_at"],
  reports: ["id", "anonymous_id", "post_id", "comment_id", "reason", "details", "created_at"],
  post_shares: ["id", "post_id", "anonymous_id", "shared_at"],
  post_views: ["id", "post_id", "anonymous_id", "viewed_at"],
  post_view_events: ["id", "post_id", "anonymous_id", "viewed_at"],
  site_visits: ["id", "anonymous_id", "path", "visited_at"],
  notifications: ["id", "anonymous_id", "type", "post_id", "comment_id", "actor_anonymous_id", "payload", "read", "created_at"],
  chat_rooms: ["id", "name", "description", "is_active", "created_at"],
  chat_messages: ["id", "room_id", "anonymous_id", "content", "parent_id", "has_effect", "created_at", "image_url"],
  message_reads: ["id", "message_id", "anonymous_id", "read_at"],
  room_presence: ["id", "room_id", "anonymous_id", "is_typing", "last_seen"],
  voice_rooms: ["id", "name", "description", "category", "max_participants", "host_anonymous_id", "is_public", "is_active", "created_at"],
  video_rooms: ["id", "name", "description", "category", "max_participants", "host_anonymous_id", "is_public", "is_active", "camera_required", "created_at", "room_type", "invite_code", "is_locked"],
};

export const IMPORT_ORDER = [
  "posts", "chat_rooms", "voice_rooms", "video_rooms", "comments", "chat_messages",
  "message_reads", "notifications", "bookmarks", "reactions", "reports", "votes",
  "post_shares", "post_views", "post_view_events", "site_visits", "room_presence",
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateBackup(value: unknown): { data: Record<string, Record<string, unknown>[]> | null; error: string | null } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { data: null, error: "This file is not a valid Cipher backup." };
  const backup = value as Record<string, unknown>;
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) return { data: null, error: "This backup format is not supported." };
  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) return { data: null, error: "The backup file is missing its data." };

  const incoming = backup.data as Record<string, unknown>;
  const unknownTables = Object.keys(incoming).filter((table) => !(table in BACKUP_FIELDS));
  if (unknownTables.length > 0) return { data: null, error: "The backup contains unsupported data sections." };

  let totalRows = 0;
  for (const [table, rawRows] of Object.entries(incoming)) {
    if (!Array.isArray(rawRows) || rawRows.length > MAX_ROWS_PER_TABLE) return { data: null, error: `The ${table} section is too large or invalid.` };
    totalRows += rawRows.length;
    const fields = new Set(BACKUP_FIELDS[table]);
    for (const row of rawRows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) return { data: null, error: `The ${table} section contains an invalid record.` };
      const record = row as Record<string, unknown>;
      if (typeof record.id !== "string" || !UUID_PATTERN.test(record.id)) return { data: null, error: `The ${table} section contains an invalid record ID.` };
      if (Object.keys(record).some((key) => !fields.has(key))) return { data: null, error: `The ${table} section contains unsupported fields.` };
    }
  }
  if (totalRows === 0) return { data: null, error: "This backup contains no records to restore." };
  return { data: incoming as Record<string, Record<string, unknown>[]>, error: null };
}