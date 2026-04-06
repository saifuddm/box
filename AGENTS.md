# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Snapshot

Box is an ephemeral storage web app for notes, links, and files across devices. No user accounts — each box can be password-protected individually with JWT-based session persistence. Content auto-expires after set time hours.
box creation is intentionally public/anonymous by design. The whole point is no user accounts, anyone can create a box.

## Commands

```bash
npm run dev        # Next.js dev server on port 3000
npm run build      # Production build
npm run lint       # ESLint
npm start          # Start production server
```

Supabase (backend):
```bash
npx supabase start              # Local Supabase instance
npx supabase functions deploy   # Deploy all Edge Functions
npx supabase db push            # Apply migrations
```

### Key Directories

- `src/app/api/` — Next.js API routes (box-auth, upload-content, storage-content)
- `src/app/[id]/` — Box view page (password gate, content display)
- `src/components/content/` — Content renderers (TextContent, ImageContent, FileContent)
- `src/utils/supabase/` — Supabase client setup (browser, server, middleware) + generated types
- `src/lib/markdown.ts` — HTML-in-markdown validation
- `supabase/functions/` — Deno Edge Functions (create-box, box-auth, get-box-content, get-storage-content, box-cleanup, tutorial-box)
- `supabase/migrations/` — SQL migrations
