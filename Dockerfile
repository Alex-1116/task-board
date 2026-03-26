FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm exec prisma generate
RUN corepack enable pnpm && pnpm build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

CMD ["node", "server.js"]
