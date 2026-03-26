# 多阶段构建 Dockerfile for Next.js + SQLite

# ==========================================
# 阶段 1: 依赖安装
# ==========================================
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10

# 复制依赖文件
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 生成 Prisma Client
RUN pnpm exec prisma generate

# ==========================================
# 阶段 2: 构建应用
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10

# 从 deps 阶段复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN pnpm build

# ==========================================
# 阶段 3: 生产运行
# ==========================================
FROM node:20-slim AS runner

# 安装必要的系统依赖 (OpenSSL 用于 Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# 创建数据库目录并设置权限
RUN mkdir -p /app/prisma
RUN chown -R nextjs:nodejs /app

# 复制必要文件 - 包括完整的源代码
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/components.json ./components.json

# 复制启动脚本
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令 - 使用启动脚本
CMD ["./docker-entrypoint.sh"]
