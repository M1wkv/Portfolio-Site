# Portfolio Site

Static portfolio deployed through GitHub Pages with Supabase as the content database and file storage.

## Active entry points

- `index.html` - public portfolio.
- `admin.html` - authenticated content editor.
- `sphere-embed.html` - compatibility entry that mirrors the public page.

## Runtime structure

- `sphere.js` / `sphere.css` - sphere, project carousel and CV cylinder.
- `supabase-loader.js` - public data loading and balanced asset selection.
- `admin.js` / `admin.css` - authenticated editor and uploads.
- `supabase-config.js` - public Supabase connection settings.
- `site-localization.js` / `admin-localization.js` - interface localization.
- `admin-storage.js` - local fallback storage.

## Security

Run `supabase-security.sql` in Supabase SQL Editor before treating the admin and storage policies as protected. See `SECURITY.md`.

## Deployment

The root files are the GitHub Pages source. The `deploy` directory mirrors deployable files for compatibility with the existing workflow.

