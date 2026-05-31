# Lumina Studio

Lumina Studio is an AI-powered presentation workspace for generating outlines,
creating slides, editing presentation content, and exporting finished decks.

## Repository

```bash
git clone https://github.com/lifefloating/lumina-studio.git
cd lumina-studio
```

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

The app starts on `http://localhost:3000` by default.

## Docker

For local development with live reload and a local Postgres container:

```bash
docker compose -f docker-compose.dev.yml up --build
```

The dev compose file maps Postgres to `localhost:5432` and runs `pnpm db:push`
before starting Next.js.

For a production-style container run:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up --build -d
```

Before deploying the production compose file, set production values for
`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `POSTGRES_PASSWORD`.

## Environment

Set the required provider, auth, upload, and database variables in `.env`.

Example database URL:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/lumina_studio"
```

Optional local model providers include Ollama and LM Studio.

## Scripts

```bash
pnpm dev        # Start the development server
pnpm build      # Build for production
pnpm start      # Start the production server
pnpm lint       # Run Biome lint
pnpm check      # Run Biome checks
pnpm type       # Run TypeScript checks
pnpm db:push    # Push Prisma schema changes
```

## Internationalization

The React UI uses `react-i18next` with English and Simplified Chinese resources.
Use the language switcher in the app header to switch languages.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
