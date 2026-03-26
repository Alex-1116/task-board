# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dependencies for Alpine (including OpenSSL for Prisma)
RUN apk add --no-cache libc6-compat python3 make gcc openssl openssl-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install pnpm
RUN npm install -g pnpm@10

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN pnpm exec prisma generate

# Copy all files
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for Alpine (including OpenSSL for Prisma)
RUN apk add --no-cache libc6-compat openssl openssl-dev

# Install pnpm in production stage
RUN npm install -g pnpm@10

# Copy necessary files from build stage (standalone mode)
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src/generated/client ./node_modules/.prisma/client

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/dev.db
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application (using Next.js standalone server)
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node server.js"]
