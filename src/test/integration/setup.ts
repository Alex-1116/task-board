import { PrismaClient } from '@/generated/client'
import { execSync } from 'child_process'
import path from 'path'

// 测试数据库路径
const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

// 创建Prisma客户端实例
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
})

export async function setupTestDatabase() {
  // 设置测试环境变量
  process.env.DATABASE_URL = `file:${testDbPath}`

  try {
    // 运行prisma migrate deploy来创建测试数据库结构
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
      stdio: 'ignore',
    })
  } catch (error) {
    console.warn('Warning: Could not run migrations, trying db push...')
    try {
      execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
        stdio: 'ignore',
      })
    } catch (e) {
      console.warn('Warning: Could not setup test database schema')
    }
  }
}

export async function teardownTestDatabase() {
  // 清理测试数据
  try {
    await prisma.task.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.column.deleteMany()
    await prisma.board.deleteMany()
  } catch (error) {
    // 忽略清理错误
  }

  await prisma.$disconnect()
}

export async function clearDatabase() {
  try {
    await prisma.task.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.column.deleteMany()
    await prisma.board.deleteMany()
  } catch (error) {
    // 忽略清理错误
  }
}
