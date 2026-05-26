# Ruleta App

An interactive lottery wheel application built for **Mutual 3 de Abril**. Administrators can create campaigns, configure prizes with stock control, and run real-time raffles through an animated spinning wheel. The public-facing wheel lets participants spin and instantly see their result, while authenticated admins manage everything from a dashboard.

## Features

- Animated canvas-based spinning wheel
- Campaign and prize management (CRUD)
- Real-time stock updates via Supabase Realtime
- Per-campaign and global reporting with PDF and Excel export
- Email/password authentication with route guards
- Multi-tablet support (simultaneous draws on different devices)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| Language | TypeScript 5.9 |
| UI | Angular Material 21 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + RPC) |
| Charts | Chart.js 4 |
| PDF export | jsPDF + jspdf-autotable |
| Excel export | SheetJS (xlsx) |
| Testing | Vitest + jsdom |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/                   # Root component, routes, config
├── components/
│   ├── login/             # Login page
│   ├── ruleta/            # Public spinning wheel
│   ├── admin/             # Admin dashboard shell
│   │   ├── campanas/      # Campaign list
│   │   ├── campana-form/  # Create / edit campaign
│   │   ├── campana-detalle/
│   │   ├── premio-form/   # Create / edit prize
│   │   ├── agregar-stock/
│   │   ├── reportes-global/
│   │   └── reportes-campana/
│   └── shared/            # Modal, confirm dialog
├── services/
│   └── supabase.service.ts
├── guards/
│   └── auth-guard.ts
└── environments/
    ├── environment.ts              # Production (committed)
    └── environment.development.ts  # Local dev (gitignored)
```

## Routes

| Path | Access | Description |
|---|---|---|
| `/login` | Public | Admin login |
| `/admin` | Auth required | Dashboard |
| `/ruleta/:id` | Public | Spinning wheel for a campaign |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Install dependencies

```bash
npm install
```

### Environment setup

The production environment file (`src/environments/environment.ts`) is committed with the public Supabase URL and anon key. For local development, create `src/environments/environment.development.ts` with the same shape:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

> This file is gitignored to avoid leaking credentials.

### Run the dev server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads automatically on file changes.

### Build for production

```bash
npm run build
```

Output goes to `dist/Ruleta-App/browser/`.

### Run tests

```bash
npm test
```

## Deployment

The app is configured for Vercel via `vercel.json`:

- **Build command:** `ng build`
- **Output directory:** `dist/Ruleta-App/browser`
- SPA rewrites are set up so all routes resolve to `index.html`

Connect the repository to a Vercel project and it deploys automatically on every push to `main`.
