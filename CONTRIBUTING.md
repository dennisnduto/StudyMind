# Contributing

Thanks for helping improve StudyMind AI. Keep changes focused, tested, and easy to review.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Run the app:

```bash
npm run dev
```

## Development Workflow

- Create a feature branch from the latest project branch.
- Keep commits focused on one meaningful change.
- Prefer existing components and styles before adding new abstractions.
- Do not commit `.env.local`, generated logs, `.next`, or `node_modules`.
- Update docs when behavior, setup, or scripts change.

## Checks

Run these before opening a pull request:

```bash
npm run lint
npm run build
```

If a database-backed change touches Prisma models, also run:

```bash
npx prisma generate
```

## Pull Request Checklist

- The branch is up to date with the target branch.
- Lint and build pass locally.
- New UI states are covered for loading, empty, and error conditions where relevant.
- Environment variables are documented in `.env.example`.
- Screens or API behavior are described clearly in the PR summary.
