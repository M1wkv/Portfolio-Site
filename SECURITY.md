# Security

## Supabase

1. Open Supabase Dashboard -> SQL Editor.
2. Run `supabase-security.sql` once.
3. Disable public sign-ups in Authentication -> Sign In / Providers -> Email.
4. Keep only the publishable key in browser code. Never add a service-role key to this repository.

The migration allows public reads of published portfolio content and limits all writes to the configured admin UID.
It replaces the existing policies for the portfolio tables and `storage.objects`; review it first if the same Supabase project contains unrelated buckets.

## Hosting

GitHub Pages cannot set full HTTP security headers. The HTML files therefore include a Content Security Policy, strict referrer rules and `noindex` directives for the admin page. For stronger header-level protection, move the static build behind Cloudflare Pages or another host that supports custom response headers.

## Account changes

If the Supabase admin user changes, update the UID in:

- `supabase-config.js`
- `supabase-security.sql`

Then run the SQL migration again.
