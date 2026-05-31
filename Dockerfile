# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN DATABASE_URL="postgresql://lumina:lumina@localhost:5432/lumina_studio" pnpm install --frozen-lockfile

FROM deps AS dev

ENV NODE_ENV=development

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM deps AS builder

ENV SKIP_ENV_VALIDATION=1

COPY . .

RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/src/env.js ./src/env.js

EXPOSE 3000

CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
