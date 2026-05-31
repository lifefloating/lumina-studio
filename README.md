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
