import { PrismaClient } from '@/generated/client'
import { afterAll, beforeAll } from 'vitest'

const prisma = new PrismaClient()

export const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
}

export const clearDB = async () => {
  try {
    await prisma.$executeRaw`DELETE FROM Task`
    await prisma.$executeRaw`DELETE FROM Column`
    await prisma.$executeRaw`DELETE FROM Board`
    await prisma.$executeRaw`DELETE FROM Tag`
  } catch (e) {
    console.log('Clear DB warning:', e)
  }
}

export { prisma }
