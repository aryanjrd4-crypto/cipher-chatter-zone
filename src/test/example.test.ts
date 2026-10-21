import { describe, it, expect } from "vitest";
import { APPROVED_ADMIN_EMAIL, isApprovedAdminEmail } from "@/lib/admin-access";
import { formatMessageTimestamp } from "@/lib/time";

describe("example", () => {
  it("allows only the configured admin email regardless of letter case", () => {
    expect(isApprovedAdminEmail(APPROVED_ADMIN_EMAIL)).toBe(true);
    expect(isApprovedAdminEmail('ARYANJRD4@GMAIL.COM')).toBe(true);
    expect(isApprovedAdminEmail('someone@example.com')).toBe(false);
    expect(isApprovedAdminEmail(null)).toBe(false);
  });

  it("uses relative labels until the inclusive 24-hour cutoff, then local absolute date and time", () => {
    const now = Date.parse('2026-10-21T02:07:00.000Z');
    expect(formatMessageTimestamp(new Date(now - 30_000).toISOString(), now)).toBe('Just now');
    expect(formatMessageTimestamp(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 minutes ago');
    expect(formatMessageTimestamp(new Date(now - 3 * 60 * 60_000).toISOString(), now)).toBe('3 hours ago');
    expect(formatMessageTimestamp(new Date(now - 23 * 60 * 60_000).toISOString(), now)).toBe('23 hours ago');
    expect(formatMessageTimestamp(new Date(now - (24 * 60 * 60_000 - 1)).toISOString(), now)).toBe('23 hours ago');
    expect(formatMessageTimestamp(new Date(now - 24 * 60 * 60_000).toISOString(), now)).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2} (AM|PM)$/);
    expect(formatMessageTimestamp(new Date(now - 30 * 60 * 60_000).toISOString(), now)).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2} (AM|PM)$/);
    expect(formatMessageTimestamp('not-a-timestamp', now)).toBe('Time unavailable');
  });
});
