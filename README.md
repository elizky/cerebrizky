# Cerebrizky

Personal second brain. Next.js 16, Tailwind 4, Prisma 7, Neon Postgres, Auth.js, shadcn.

## Setup

1. Copy `.env.example` → `.env.local`
2. Neon: pooled → `DATABASE_URL`, direct (sin `-pooler`) → `DATABASE_URL_UNPOOLED`
3. Optional Google OAuth → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - Redirect: `http://localhost:3000/api/auth/callback/google`
4. Use npm scripts only (`npm run migrate:dev`), never bare `prisma migrate`

```bash
npm install
npm run migrate:dev
npm run db:seed
npm run dev
```

Seed: `izky@cerebrizky.local` / `cerebrizky`

## Stack

- App Router + Server Actions
- Unified `Item` model (`IDEA | NOTE | TASK | LINK | BOOK | PROJECT`)
- Brain home with dynamic region cards
- Quick Capture → Inbox
