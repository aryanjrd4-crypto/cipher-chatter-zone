import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BACKUP_FORMAT, BACKUP_VERSION, validateBackup } from "./backup-format.ts";

const validRecord = {
  id: "a04b0b85-3350-4a70-84c3-42aa5e46ad95",
  anonymous_id: "cipher-example",
  title: "Test post",
};

Deno.test("accepts a versioned backup containing supported app records", () => {
  const result = validateBackup({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: { posts: [validRecord] },
  });
  assertEquals(result.error, null);
  assertEquals(result.data?.posts.length, 1);
});

Deno.test("rejects backups that try to import role or profile records", () => {
  const result = validateBackup({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: { user_roles: [{ id: validRecord.id }] },
  });
  assertEquals(result.data, null);
  assertEquals(result.error, "The backup contains unsupported data sections.");
});

Deno.test("rejects extra privileged fields on supported records", () => {
  const result = validateBackup({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: { posts: [{ ...validRecord, role: "admin" }] },
  });
  assertEquals(result.data, null);
  assertEquals(result.error, "The posts section contains unsupported fields.");
});

Deno.test("rejects invalid record identifiers before restore", () => {
  const result = validateBackup({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: { posts: [{ ...validRecord, id: "not-a-uuid" }] },
  });
  assertEquals(result.data, null);
  assertEquals(result.error, "The posts section contains an invalid record ID.");
});