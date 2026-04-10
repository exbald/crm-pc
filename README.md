# Ridgeline CRM

CRM platform for managing CRE deal pipelines — contacts, projects, tasks, issues, and reporting.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5
- **UI:** Radix UI + Tailwind CSS v4
- **Data Fetching:** TanStack React Query

## Features

- User registration and authentication (credentials)
- Role-based access (admin, project manager, team member)
- Contact management with project associations
- Project tracking with milestones and status
- Task management with priorities and assignment
- Issue tracking (bugs, enhancements, requests)
- Dashboard with overview metrics
- Reports page

## Getting Started

```bash
cp .env.example .env.local
# Edit .env.local with your database URL and auth secret

npm install
npm run db:push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & registration pages
│   ├── (dashboard)/     # Protected dashboard pages
│   └── api/             # REST API routes
├── components/
│   ├── layout/          # Sidebar & topbar
│   ├── providers.tsx    # Client-side providers
│   └── ui/              # Radix UI primitives
├── lib/
│   ├── api/             # API client
│   ├── auth.ts          # NextAuth config
│   ├── db/              # Drizzle schema & client
│   └── utils.ts         # Utilities
└── types/               # Type declarations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migrations |
| `npm run seed` | Seed database with sample data |
