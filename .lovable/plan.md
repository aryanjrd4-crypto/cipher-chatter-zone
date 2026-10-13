# Secure Admin Reports and Moderation

## What will change
- Replace the shared master password with verified email sign-in for the approved admin account, `aryanjrd4@gmail.com`.
- Add a private admin accounting view for post views, anonymous Cipher IDs, page visits, and timestamps; add post deletion alongside the existing video-room controls.
- Keep visitor reports pseudonymous: no names, email addresses, IP addresses, or device fingerprints are collected for visitors.
- Historical page visits cannot be reconstructed; visit records begin after this change is live. Existing post-view records remain available, while repeat view events are recorded going forward.

## Technical details
- Create protected `user_roles` and `profiles` tables, role-checking functions, and database triggers. Only the approved, email-confirmed account receives the admin role; no other sign-ups are allowed.
- Record site visits and per-entry post-view events with anonymous IDs and timestamps. Allow public event insertion but restrict report reads to authenticated admins.
- Restrict admin audit logs to admins. Use server-enforced policies/functions for admin post deletion while retaining anonymous users' existing own-post deletion flow.
- Update the existing admin screen with summary totals, post/view records, visitor history, and moderation actions while preserving video-room management.
- Enable email sign-in without enabling automatic email confirmation; add no visitor-facing accounts or real-name collection.