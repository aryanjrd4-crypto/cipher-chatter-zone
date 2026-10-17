import { describe, it, expect } from "vitest";
import { APPROVED_ADMIN_EMAIL, isApprovedAdminEmail } from "@/lib/admin-access";

describe("example", () => {
  it("allows only the configured admin email regardless of letter case", () => {
    expect(isApprovedAdminEmail(APPROVED_ADMIN_EMAIL)).toBe(true);
    expect(isApprovedAdminEmail('ARYANJRD4@GMAIL.COM')).toBe(true);
    expect(isApprovedAdminEmail('someone@example.com')).toBe(false);
    expect(isApprovedAdminEmail(null)).toBe(false);
  });
});
