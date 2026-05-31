# Contributing to Lumina Studio

Thanks for improving Lumina Studio.

## Development

```bash
git clone https://github.com/lifefloating/lumina-studio.git
cd lumina-studio
pnpm install
cp .env.example .env
pnpm dev
```

## Checks

Run the relevant checks before opening a pull request:

```bash
pnpm lint
pnpm type
pnpm build
```

## Pull Requests

Keep pull requests focused. Include a short summary, mention user-visible
changes, and note any checks that could not be run locally.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
