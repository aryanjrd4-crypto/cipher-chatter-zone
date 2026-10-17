export const APPROVED_ADMIN_EMAIL = 'aryanjrd4@gmail.com';

export function isApprovedAdminEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase() === APPROVED_ADMIN_EMAIL;
}