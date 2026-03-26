# 部署指南

本文档提供多种部署方式的详细说明。

## 目录

- [Docker 部署 (推荐)](#docker-部署-推荐)
- [Serverless 部署 (Vercel)](#serverless-部署-vercel)
- [传统 VPS 部署](#传统-vps-部署)

---

## Docker 部署 (推荐)

适用于任何支持 Docker 的服务器，数据库随容器一起打包。

### 快速开始

```bash
# 1. 克隆代码
git clone <your-repo>
cd task-board

# 2. 使用 Docker Compose 启动
docker-compose up -d

# 3. 访问应用
open http://localhost:3000
```

### 构建并推送镜像

```bash
# 构建镜像
docker build -t task-board:latest .

# 标记镜像
docker tag task-board:latest your-registry/task-board:latest

# 推送镜像
docker push your-registry/task-board:latest
```

### 数据持久化

SQLite 数据库通过 Docker volume 挂载到 `./data` 目录：

```yaml
volumes:
  - ./data:/app/prisma
```

**重要**: 定期备份 `./data` 目录！

---

## Serverless 部署 (Vercel)

⚠️ **重要提示**: 项目默认使用本地 SQLite 数据库，但 Vercel 等 Serverless 平台是无状态的，无法持久化本地文件。

### 数据库迁移方案

#### 方案 1: Turso (推荐)

[Turso](https://turso.tech/) 是 SQLite 的边缘数据库托管服务，与 Prisma 兼容。

**迁移步骤:**

1. **安装 Turso CLI**

   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **创建数据库**

   ```bash
   turso auth login
   turso db create task-board
   turso db show task-board
   ```

3. **更新 Prisma Schema**

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

4. **更新环境变量**

   ```bash
   # .env.local
   DATABASE_URL="libsql://your-db.turso.io"
   DATABASE_AUTH_TOKEN="your-auth-token"
   ```

5. **安装适配器**

   ```bash
   pnpm add @libsql/client
   ```

6. **更新数据库连接代码**

   ```typescript
   // src/lib/db.ts
   import { createClient } from '@libsql/client';
   import { PrismaLibSQL } from '@prisma/adapter-libsql';
   import { PrismaClient } from '@prisma/client';

   const libsql = createClient({
     url: process.env.DATABASE_URL!,
     authToken: process.env.DATABASE_AUTH_TOKEN,
   });

   const adapter = new PrismaLibSQL(libsql);
   export const prisma = new PrismaClient({ adapter });
   ```

#### 方案 2: PostgreSQL (Neon/Supabase)

如果需要更强大的关系型数据库功能：

1. **更新 Prisma Schema**

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **迁移数据**

   ```bash
   pnpm exec prisma migrate dev
   ```

3. **部署到 Vercel**
   ```bash
   pnpm dlx vercel
   ```

### Vercel 部署配置

创建 `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

---

## 传统 VPS 部署

### 使用 PM2 进程管理

```bash
# 1. 安装依赖
pnpm install --production

# 2. 构建应用
pnpm build

# 3. 安装 PM2
npm install -g pm2

# 4. 创建 PM2 配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'task-board',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 5. 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 环境变量参考

| 变量名                | 说明             | 示例                    |
| --------------------- | ---------------- | ----------------------- |
| `NODE_ENV`            | 运行环境         | `production`            |
| `DATABASE_URL`        | 数据库连接字符串 | `file:./prisma/prod.db` |
| `DATABASE_AUTH_TOKEN` | Turso 认证令牌   | `eyJ...`                |
| `PORT`                | 服务端口         | `3000`                  |
| `HOSTNAME`            | 主机地址         | `0.0.0.0`               |

---

## 备份策略

### SQLite 备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/prisma/prod.db "$BACKUP_DIR/prod_$DATE.db"
# 保留最近 7 天的备份
find $BACKUP_DIR -name "prod_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到 crontab (每天凌晨 2 点备份)
0 2 * * * /path/to/backup.sh
```

---

## 故障排查

### 常见问题

1. **数据库权限错误**

   ```bash
   # 确保数据库目录有正确权限
   chown -R 1001:1001 ./data
   ```

2. **Prisma Client 未生成**

   ```bash
   pnpm exec prisma generate
   ```

3. **端口被占用**
   ```bash
   # 查找占用 3000 端口的进程
   lsof -i :3000
   # 或更换端口
   PORT=3001 pnpm start
   ```

---

## 生产环境检查清单

- [ ] 环境变量已正确配置
- [ ] 数据库已迁移到生产环境
- [ ] 已配置自动备份
- [ ] 已配置 SSL/TLS
- [ ] 已配置监控和日志收集
- [ ] 已配置健康检查端点
