#!/bin/sh
set -e

# 运行数据库迁移
echo "Running database migrations..."
pnpm exec prisma migrate deploy

# 启动应用
echo "Starting application..."
exec pnpm start
