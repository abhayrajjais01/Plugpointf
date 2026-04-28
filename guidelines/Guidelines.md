# PlugPoint — Contributor Guidelines

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (utility-first)
- **Database**: Supabase (PostgreSQL + Realtime + Storage)
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Mapping**: MapLibre GL JS
- **Payments**: Razorpay SDK + PlugPoint Wallet

## Project Conventions

### File Organization
- **Types**: All shared interfaces live in `src/types/index.ts` — never define types inline or in mock-data files.
- **Utilities**: Shared logic lives in `src/lib/` (e.g., `geo.ts`, `logger.ts`, `db.ts`).
- **Components**: One component per file in `src/app/components/`.
- **Services**: External API integrations in `src/services/`.

### Code Style
- Use `import type { ... }` for type-only imports.
- Prefer named exports over default exports (except `App.tsx`).
- Use the `logger` utility (`src/lib/logger.ts`) instead of raw `console.log` — it auto-strips in production.
- Use `date-fns` for all date parsing/formatting — never use `new Date(string)` for locale-dependent formats.

### Database (Supabase)
- All DB functions live in `src/lib/db.ts`.
- Mapper functions convert between Postgres `snake_case` and JS `camelCase`.
- Wallet transactions use Postgres triggers for atomicity — see `schema.sql`.

### Naming
- Components: `PascalCase.tsx` (e.g., `HomePage.tsx`)
- Utilities: `camelCase.ts` (e.g., `geo.ts`)
- CSS variables: defined in `src/styles/theme.css`
- DB columns: `snake_case` (Postgres standard)

### Environment Variables
All secrets go in `.env` (not committed). Required variables:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_RAZORPAY_KEY_ID
VITE_OCM_API_KEY (optional)
```

## Getting Started
```bash
npm install
npm run dev
```
