# StudyMind AI

StudyMind AI is a Next.js study workspace that turns notes into summaries, chat context, quizzes, and progress insights. The current branch ships a polished demo experience with realistic data while keeping the Prisma and Auth.js structure ready for a real backend.

## Features

- Upload-flow preview for PDF, DOCX, and TXT study materials
- Document summary cards shaped like backend records
- Context-aware chat UI with document switching
- Interactive quiz flow with scoring and explanations
- Analytics dashboard with recommendations
- Auth.js credential screens and Prisma user models
- Responsive app shell with dark and light mode

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- Auth.js / NextAuth
- PostgreSQL-ready schema

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

The app expects these values when backend auth and database flows are enabled:

- `DATABASE_URL`: PostgreSQL connection string for Prisma.
- `NEXTAUTH_SECRET`: secret used by Auth.js session signing.
- `NEXTAUTH_URL`: canonical local or deployed app URL.

For the frontend demo, you can still browse the dashboard, upload, chat, quiz, analytics, and settings pages without a connected database.

## Prisma

Generate the client after installing dependencies or changing the schema:

```bash
npx prisma generate
```

Seed demo records once a database is connected:

```bash
npm run seed
```

The seed script creates a demo user and sample study records that match the UI content.

## Quality Checks

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

## Demo Account

The seeded demo account uses:

```text
Email: student@studymind.ai
Password: studymind-demo
```

## Project Status

StudyMind AI is in active development. The frontend is ready for API, storage, AI retrieval, and production auth wiring.
