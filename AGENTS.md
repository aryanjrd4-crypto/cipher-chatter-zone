# Architecture decisions

- Enforce administrator identity and data access in Cloud Auth and database role policies, because browser flags and client-side passwords can be forged.
- Keep visitor analytics pseudonymous and store only anonymous IDs, URL paths, and event timestamps, because the platform promises anonymous participation.
- Serve admin backups and restores through an authenticated, role-checked Cloud function with a strict app-table allowlist, because privileged data must never rely on browser-only access checks.