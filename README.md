# StudyMind AI

StudyMind AI is a Next.js study workspace that turns uploaded notes into summaries, grounded chat, quizzes, and progress insights backed by Prisma and Auth.js.

## Features

- PDF, DOCX, and TXT upload with parsing and AI summaries
- Authenticated document dashboard and analytics
- Context-aware chat grounded in user-owned documents
- Quiz generation, scoring, and progress tracking
- Freemium access with Premium subscription gating
- Protected admin page for users, subscriptions, materials, and quiz activity
- Responsive app shell with dark and light mode

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- Auth.js / NextAuth
- PostgreSQL

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Generate Prisma Client:

```bash
npx prisma generate
```

Start the dev server:

```bash
npm run dev
```

Open the app:

```text
http://127.0.0.1:3000
```

## Environment

The app expects these values:

- `DATABASE_URL`: PostgreSQL connection string for Prisma.
- `NEXTAUTH_SECRET`: secret used by Auth.js session signing.
- `NEXTAUTH_URL`: canonical local or deployed app URL.
- `ADMIN_EMAILS`: comma-separated emails that can access `/admin`.
- `SEED_ADMIN_EMAIL`: optional email for the seeded admin account.
- `SEED_ADMIN_PASSWORD`: optional password for the seeded admin account.

## Prisma

Generate the client after installing dependencies or changing the schema:

```bash
npx prisma generate
```

Apply schema changes to your database:

```bash
npx prisma db push
```

Create an initial admin account:

```bash
npm run seed
```

## Quality Checks

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

## Access Model

Free users receive a limited trial window and a limited number of AI actions across uploads, chat prompts, and quiz generation. Premium and admin users can continue using AI study tools after the free quota ends.
