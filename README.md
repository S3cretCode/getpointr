# GetPointr

**Point the way. Never take over.**

GetPointr is an interactive visual-guidance demo built for cross-device testing (phone + laptop) with zero remote-control risk. Helpers guide device owners using animated laser rings, directional arrows, live laser trails, and numbered step sequences—while balances, passwords, account numbers, and 2FA codes stay blurred on the helper's screen.

## Core Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page — launch a phone demo, open a helper console with QR code, or join by 6-character code |
| `/host/[room]` | Phone experience — Trusted Circle verification, Harbor Credit Union mock app, incoming visual pointers, and automatic 60-second guided demo when testing solo |
| `/helper/[room]` | Helper desktop console — QR pairing screen, live view-only mirror, Ring / Arrow / Steps tools, drag-to-laser, quick captions, Privacy Shield toggle, and metadata-only session log |

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

- **Without Supabase keys** (`.env.local` omitted or empty), GetPointr automatically uses browser `BroadcastChannel` so two tabs in the same browser communicate immediately.
- **With Supabase keys**, phones and laptops sync across networks via Supabase Realtime Broadcast + Presence.

## Environment Variables

Copy `.env.example` to `.env.local` (and add the same variables in **Vercel → Settings → Environment Variables**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

*(Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported automatically.)*

## Production Build

```bash
npm run lint
npm run build
npm start
```
