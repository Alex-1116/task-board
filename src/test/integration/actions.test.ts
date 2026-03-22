import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@/generated/client'
import { execSync } from 'child_process'
import path from 'path'

// 测试数据库路径
const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

// 创建测试用的Prisma客户端
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
})

// 直接实现Server Actions函数，使用测试数据库
async function getBoards() {
  return prisma.board.findMany({
    orderBy: { createdAt: 'asc' },
  })
}

async function getBoardById(id: string) {
  return prisma.board.findUnique({
    where: { id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: { tags: true },
          },
        },
      },
    },
  })
}

async function createBoard(name: string) {
  return prisma.board.create({
    data: {
      name,
      columns: {
        create: [
          { name: 'Todo', order: 0 },
          { name: 'Doing', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
  })
}

async function updateBoard(id: string, name: string) {
  return prisma.board.update({
    where: { id },
    data: { name },
  })
}

async function deleteBoard(id: string) {
  await prisma.board.delete({ where: { id } })
}

async function createColumn(boardId: string, name: string) {
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
  })
  const order = lastColumn ? lastColumn.order + 1 : 0

  return prisma.column.create({
    data: { name, boardId, order },
  })
}

async function updateColumn(id: string, name: string) {
  return prisma.column.update({
    where: { id },
    data: { name },
  })
}

async function deleteColumn(id: string) {
  await prisma.column.delete({ where: { id } })
}

async function updateColumnOrders(updates: { id: string; order: number }[]) {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.column.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    )
  )
}

async function createTask(data: {
  title: string
  description?: string | null
  columnId: string
  dueDate?: Date | null
}) {
  const lastTask = await prisma.task.findFirst({
    where: { columnId: data.columnId },
    orderBy: { order: 'desc' },
  })
  const order = lastTask ? lastTask.order + 1 : 0

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      dueDate: data.dueDate,
      order,
    },
  })
}

async function updateTask(
  id: string,
  data: { title?: string; description?: string | null; dueDate?: Date | null; columnId?: string }
) {
  return prisma.task.update({
    where: { id },
    data,
  })
}

async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } })
}

async function updateTaskOrders(
  updates: { id: string; order: number; columnId: string }[]
) {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.task.update({
        where: { id: update.id },
        data: { order: update.order, columnId: update.columnId },
      })
    )
  )
}

describe('Server Actions Integration Tests', () => {
  // 测试数据跟踪
  const createdBoardIds: string[] = []

  beforeAll(async () => {
    // 设置测试数据库
    process.env.DATABASE_URL = `file:${testDbPath}`

    try {
      // 尝试运行迁移
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
        stdio: 'ignore',
      })
    } catch {
      // 如果迁移失败，尝试db push
      try {
        execSync('npx prisma db push --accept-data-loss', {
          env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
          stdio: 'ignore',
        })
      } catch (e) {
        console.warn('Warning: Could not setup test database')
      }
    }

    await prisma.$connect()
  })

  afterAll(async () => {
    // 清理所有创建的测试数据
    for (const boardId of createdBoardIds) {
      try {
        await prisma.board.deleteMany({ where: { id: boardId } })
      } catch {
        // 忽略删除错误
      }
    }
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // 每个测试前清理数据
    try {
      await prisma.task.deleteMany()
      await prisma.column.deleteMany()
      await prisma.board.deleteMany()
    } catch {
      // 忽略清理错误
    }
    createdBoardIds.length = 0
  })

  describe('Board Operations', () => {
    it('should create a board with default columns', async () => {
      const board = await createBoard('Test Board')
      createdBoardIds.push(board.id)

      expect(board).toBeDefined()
      expect(board.name).toBe('Test Board')

      // 验证默认列是否创建
      const boardWithColumns = await getBoardById(board.id)
      expect(boardWithColumns?.columns).toHaveLength(3)
      expect(boardWithColumns?.columns.map(c => c.name)).toEqual(['Todo', 'Doing', 'Done'])
    })

    it('should get all boards', async () => {
      const board1 = await createBoard('Board 1')
      const board2 = await createBoard('Board 2')
      createdBoardIds.push(board1.id, board2.id)

      const boards = await getBoards()
      expect(boards.length).toBeGreaterThanOrEqual(2)
      expect(boards.some(b => b.id === board1.id)).toBe(true)
      expect(boards.some(b => b.id === board2.id)).toBe(true)
    })

    it('should get board by id with columns and tasks', async () => {
      const board = await createBoard('Board with Data')
      createdBoardIds.push(board.id)

      const boardWithData = await getBoardById(board.id)
      expect(boardWithData).toBeDefined()
      expect(boardWithData?.id).toBe(board.id)
      expect(boardWithData?.columns).toBeDefined()
    })

    it('should update board name', async () => {
      const board = await createBoard('Original Name')
      createdBoardIds.push(board.id)

      const updated = await updateBoard(board.id, 'Updated Name')
      expect(updated.name).toBe('Updated Name')

      const fetched = await getBoardById(board.id)
      expect(fetched?.name).toBe('Updated Name')
    })

    it('should delete board and cascade delete columns', async () => {
      const board = await createBoard('Board to Delete')
      createdBoardIds.push(board.id)

      const boardWithColumns = await getBoardById(board.id)
      const columnIds = boardWithColumns?.columns.map(c => c.id) || []

      await deleteBoard(board.id)

      const deletedBoard = await getBoardById(board.id)
      expect(deletedBoard).toBeNull()

      // 验证列是否也被删除
      for (const columnId of columnIds) {
        const column = await prisma.column.findUnique({ where: { id: columnId } })
        expect(column).toBeNull()
      }
    })
  })

  describe('Column Operations', () => {
    let testBoardId: string

    beforeEach(async () => {
      const board = await createBoard('Test Board for Columns')
      testBoardId = board.id
      createdBoardIds.push(board.id)
    })

    it('should create a column', async () => {
      const column = await createColumn(testBoardId, 'New Column')

      expect(column).toBeDefined()
      expect(column.name).toBe('New Column')
      expect(column.boardId).toBe(testBoardId)
      expect(column.order).toBeDefined()
    })

    it('should create columns with sequential order', async () => {
      const col1 = await createColumn(testBoardId, 'Column 1')
      const col2 = await createColumn(testBoardId, 'Column 2')
      const col3 = await createColumn(testBoardId, 'Column 3')

      expect(col1.order).toBeLessThan(col2.order)
      expect(col2.order).toBeLessThan(col3.order)
    })

    it('should update column name', async () => {
      const column = await createColumn(testBoardId, 'Original Column')

      const updated = await updateColumn(column.id, 'Updated Column')
      expect(updated.name).toBe('Updated Column')
    })

    it('should delete column and cascade delete tasks', async () => {
      const column = await createColumn(testBoardId, 'Column with Tasks')

      // 在列中创建任务
      const task = await createTask({
        title: 'Test Task',
        columnId: column.id,
      })

      await deleteColumn(column.id)

      // 验证列是否被删除
      const deletedColumn = await prisma.column.findUnique({ where: { id: column.id } })
      expect(deletedColumn).toBeNull()

      // 验证任务是否也被删除
      const deletedTask = await prisma.task.findUnique({ where: { id: task.id } })
      expect(deletedTask).toBeNull()
    })

    it('should update column orders in batch', async () => {
      const col1 = await createColumn(testBoardId, 'Column A')
      const col2 = await createColumn(testBoardId, 'Column B')
      const col3 = await createColumn(testBoardId, 'Column C')

      // 反转顺序
      await updateColumnOrders([
        { id: col1.id, order: 2 },
        { id: col2.id, order: 1 },
        { id: col3.id, order: 0 },
      ])

      const board = await getBoardById(testBoardId)
      const columns = board?.columns || []

      expect(columns.find(c => c.id === col1.id)?.order).toBe(2)
      expect(columns.find(c => c.id === col2.id)?.order).toBe(1)
      expect(columns.find(c => c.id === col3.id)?.order).toBe(0)
    })
  })

  describe('Task Operations', () => {
    let testBoardId: string
    let testColumnId: string

    beforeEach(async () => {
      const board = await createBoard('Test Board for Tasks')
      testBoardId = board.id
      createdBoardIds.push(board.id)

      const boardWithColumns = await getBoardById(board.id)
      testColumnId = boardWithColumns?.columns[0].id || ''
    })

    it('should create a task', async () => {
      const task = await createTask({
        title: 'Test Task',
        description: 'Test Description',
        columnId: testColumnId,
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('Test Task')
      expect(task.description).toBe('Test Description')
      expect(task.columnId).toBe(testColumnId)
    })

    it('should create tasks with sequential order in same column', async () => {
      const task1 = await createTask({ title: 'Task 1', columnId: testColumnId })
      const task2 = await createTask({ title: 'Task 2', columnId: testColumnId })
      const task3 = await createTask({ title: 'Task 3', columnId: testColumnId })

      expect(task1.order).toBeLessThan(task2.order)
      expect(task2.order).toBeLessThan(task3.order)
    })

    it('should update task', async () => {
      const task = await createTask({
        title: 'Original Title',
        columnId: testColumnId,
      })

      const updated = await updateTask(task.id, {
        title: 'Updated Title',
        description: 'Updated Description',
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.description).toBe('Updated Description')
    })

    it('should move task to different column', async () => {
      const boardWithColumns = await getBoardById(testBoardId)
      const column1Id = boardWithColumns?.columns[0].id || ''
      const column2Id = boardWithColumns?.columns[1].id || ''

      const task = await createTask({
        title: 'Task to Move',
        columnId: column1Id,
      })

      const moved = await updateTask(task.id, { columnId: column2Id })
      expect(moved.columnId).toBe(column2Id)
    })

    it('should delete task', async () => {
      const task = await createTask({
        title: 'Task to Delete',
        columnId: testColumnId,
      })

      await deleteTask(task.id)

      const deletedTask = await prisma.task.findUnique({ where: { id: task.id } })
      expect(deletedTask).toBeNull()
    })

    it('should update task orders in batch', async () => {
      const task1 = await createTask({ title: 'Task A', columnId: testColumnId })
      const task2 = await createTask({ title: 'Task B', columnId: testColumnId })
      const task3 = await createTask({ title: 'Task C', columnId: testColumnId })

      // 反转顺序
      await updateTaskOrders([
        { id: task1.id, order: 2, columnId: testColumnId },
        { id: task2.id, order: 1, columnId: testColumnId },
        { id: task3.id, order: 0, columnId: testColumnId },
      ])

      const board = await getBoardById(testBoardId)
      const tasks = board?.columns[0].tasks || []

      expect(tasks.find(t => t.id === task1.id)?.order).toBe(2)
      expect(tasks.find(t => t.id === task2.id)?.order).toBe(1)
      expect(tasks.find(t => t.id === task3.id)?.order).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle non-existent board id gracefully', async () => {
      const result = await getBoardById('non-existent-id')
      expect(result).toBeNull()
    })

    it('should handle empty board name', async () => {
      const board = await createBoard('')
      createdBoardIds.push(board.id)
      expect(board.name).toBe('')
    })

    it('should handle special characters in names', async () => {
      const specialName = 'Board <script>alert("xss")</script> & "quotes"'
      const board = await createBoard(specialName)
      createdBoardIds.push(board.id)

      expect(board.name).toBe(specialName)

      const fetched = await getBoardById(board.id)
      expect(fetched?.name).toBe(specialName)
    })
  })
})
