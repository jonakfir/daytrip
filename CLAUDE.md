# Daytrip — Project CLAUDE.md

**Stack:** Next.js 14 (App Router), React 18, TypeScript, Supabase, Stripe, Three.js, Framer Motion, Tailwind CSS 3

**Architecture:** Server Components by default. Client Components only for interactivity (Three.js scenes, animations, forms). API routes for webhooks and auth.

## Critical Rules

### Database
- All queries use Supabase client with RLS enabled — never bypass RLS
- Migrations in `supabase/migrations/` — never modify the database directly
- Use `select()` with explicit column lists, not `select('*')`
- All user-facing queries must include `.limit()` to prevent unbounded results

### Authentication
- Use `@supabase/supabase-js` client with proper auth checks
- Protected routes check `getUser()` — never trust `getSession()` alone
- Auth tokens managed via jose for JWT operations

### Billing
- Stripe integration for payments
- Never trust client-side price data — always fetch from Stripe server-side
- Webhook handler validates Stripe signatures

### Code Style
- No emojis in code or comments
- Immutable patterns only — spread operator, never mutate
- Server Components: no `'use client'` directive, no `useState`/`useEffect`
- Client Components: `'use client'` at top, minimal — extract logic to hooks
- Prefer Zod schemas for input validation

### Three.js / 3D
- Three.js scenes must be Client Components (`'use client'`)
- Dispose geometries, materials, and textures on unmount to prevent memory leaks
- Use `useFrame` or RAF loop with proper cleanup
- Keep 3D assets optimized (compressed textures, low-poly where possible)

## File Structure

```
app/
  about/           # About page
  account/         # User account management
  admin/           # Admin panel
  api/             # API routes (auth, webhooks, etc.)
  contact/         # Contact page
  destinations/    # Trip destinations
  guides/          # Travel guides
  login/           # Auth pages
  signup/
  pricing/         # Pricing page with Stripe
  trip/            # Individual trip view
  trips/           # Trip listing/search
  layout.tsx       # Root layout
  page.tsx         # Homepage
```

## Key Patterns

### API Response Format
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Framer Motion
- Use `framer-motion` for page transitions and scroll animations
- Keep animations subtle and performant (transform/opacity only)
- Respect `prefers-reduced-motion`

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-only
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ANTHROPIC_API_KEY=                # Server-only, for AI features
```

## Git Workflow
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Deploy: Vercel
