import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock the db module - vi.mock is hoisted to top, so we define mock inside
vi.mock('@/lib/db', () => ({
  db: {
    board: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    column: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Import actions and db after mocks are set up
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrders,
} from '@/lib/actions'
import { db } from '@/lib/db'

// Use db as mockPrisma
const mockPrisma = db

describe('Board Actions - 单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getBoards 应该调用 prisma.board.findMany', async () => {
    const mockBoards = [{ id: '1', name: 'Board 1', createdAt: new Date(), updatedAt: new Date() }]
    mockPrisma.board.findMany.mockResolvedValue(mockBoards)

    const result = await getBoards()

    expect(mockPrisma.board.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
    })
    expect(result).toEqual(mockBoards)
  })

  it('getBoardById 应该调用 prisma.board.findUnique 并包含关联数据', async () => {
    const mockBoard = { id: '1', name: 'Board 1', columns: [] }
    mockPrisma.board.findUnique.mockResolvedValue(mockBoard)

    const result = await getBoardById('1')

    expect(mockPrisma.board.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: expect.any(Object),
    })
    expect(result).toEqual(mockBoard)
  })

  it('createBoard 应该创建看板并包含默认列', async () => {
    const mockBoard = { id: '1', name: 'New Board' }
    mockPrisma.board.create.mockResolvedValue(mockBoard)

    const result = await createBoard('New Board')

    expect(mockPrisma.board.create).toHaveBeenCalledWith({
      data: {
        name: 'New Board',
        columns: {
          create: [
            { name: 'Todo', order: 0 },
            { name: 'Doing', order: 1 },
            { name: 'Done', order: 2 },
          ],
        },
      },
    })
    expect(result).toEqual(mockBoard)
  })

  it('updateBoard 应该更新看板名称', async () => {
    const mockBoard = { id: '1', name: 'Updated Name' }
    mockPrisma.board.update.mockResolvedValue(mockBoard)

    const result = await updateBoard('1', 'Updated Name')

    expect(mockPrisma.board.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Updated Name' },
    })
    expect(result).toEqual(mockBoard)
  })

  it('deleteBoard 应该调用 prisma.board.delete', async () => {
    mockPrisma.board.delete.mockResolvedValue({ id: '1' })

    await deleteBoard('1')

    expect(mockPrisma.board.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })
})

describe('Column Actions - 单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createColumn 应该创建新列并计算正确的 order', async () => {
    // Mock 最后一列查询
    mockPrisma.column.findFirst.mockResolvedValue({ id: 'col1', order: 2 })
    const mockColumn = { id: 'col2', name: 'New Column', boardId: 'board1', order: 3 }
    mockPrisma.column.create.mockResolvedValue(mockColumn)

    const result = await createColumn('board1', 'New Column')

    expect(mockPrisma.column.findFirst).toHaveBeenCalledWith({
      where: { boardId: 'board1' },
      orderBy: { order: 'desc' },
    })
    expect(mockPrisma.column.create).toHaveBeenCalledWith({
      data: { name: 'New Column', boardId: 'board1', order: 3 },
    })
    expect(result).toEqual(mockColumn)
  })

  it('createColumn 没有列时应该从 0 开始', async () => {
    mockPrisma.column.findFirst.mockResolvedValue(null)
    const mockColumn = { id: 'col1', name: 'First Column', boardId: 'board1', order: 0 }
    mockPrisma.column.create.mockResolvedValue(mockColumn)

    const result = await createColumn('board1', 'First Column')

    expect(mockPrisma.column.create).toHaveBeenCalledWith({
      data: { name: 'First Column', boardId: 'board1', order: 0 },
    })
    expect(result).toEqual(mockColumn)
  })

  it('updateColumn 应该更新列名称', async () => {
    const mockColumn = { id: 'col1', name: 'Updated' }
    mockPrisma.column.update.mockResolvedValue(mockColumn)

    const result = await updateColumn('col1', 'Updated')

    expect(mockPrisma.column.update).toHaveBeenCalledWith({
      where: { id: 'col1' },
      data: { name: 'Updated' },
    })
    expect(result).toEqual(mockColumn)
  })

  it('deleteColumn 应该调用 prisma.column.delete', async () => {
    mockPrisma.column.delete.mockResolvedValue({ id: 'col1' })

    await deleteColumn('col1')

    expect(mockPrisma.column.delete).toHaveBeenCalledWith({
      where: { id: 'col1' },
    })
  })
})

describe('Task Actions - 单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createTask 应该创建新任务并计算正确的 order', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 'task1', order: 1 })
    const mockTask = { 
      id: 'task2', 
      title: 'New Task', 
      columnId: 'col1',
      description: null,
      dueDate: null,
      order: 2,
    }
    mockPrisma.task.create.mockResolvedValue(mockTask)

    const result = await createTask({
      title: 'New Task',
      columnId: 'col1',
    })

    expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
      where: { columnId: 'col1' },
      orderBy: { order: 'desc' },
    })
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: {
        title: 'New Task',
        description: undefined,
        columnId: 'col1',
        dueDate: undefined,
        order: 2,
      },
    })
    expect(result).toEqual(mockTask)
  })

  it('createTask 应该支持 description 和 dueDate 参数', async () => {
    mockPrisma.task.findFirst.mockResolvedValue(null)
    const dueDate = new Date('2024-12-31')
    const mockTask = { 
      id: 'task1', 
      title: 'Test Task', 
      description: 'Test Description',
      columnId: 'col1',
      dueDate,
      order: 0,
    }
    mockPrisma.task.create.mockResolvedValue(mockTask)

    const result = await createTask({
      title: 'Test Task',
      description: 'Test Description',
      columnId: 'col1',
      dueDate,
    })

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Test Task',
        description: 'Test Description',
        columnId: 'col1',
        dueDate,
        order: 0,
      },
    })
    expect(result).toEqual(mockTask)
  })

  it('updateTask 应该更新任务信息', async () => {
    const mockTask = { id: 'task1', title: 'Updated', description: 'New Desc' }
    mockPrisma.task.update.mockResolvedValue(mockTask)

    const result = await updateTask('task1', {
      title: 'Updated',
      description: 'New Desc',
    })

    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task1' },
      data: {
        title: 'Updated',
        description: 'New Desc',
      },
    })
    expect(result).toEqual(mockTask)
  })

  it('deleteTask 应该调用 prisma.task.delete', async () => {
    mockPrisma.task.delete.mockResolvedValue({ id: 'task1' })

    await deleteTask('task1')

    expect(mockPrisma.task.delete).toHaveBeenCalledWith({
      where: { id: 'task1' },
    })
  })

  it('updateTaskOrders 应该使用事务批量更新', async () => {
    const updates = [
      { id: 'task1', order: 0, columnId: 'col1' },
      { id: 'task2', order: 1, columnId: 'col1' },
    ]
    mockPrisma.$transaction.mockResolvedValue([])

    await updateTaskOrders(updates)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockPrisma.task.update).toHaveBeenCalledTimes(2)
  })
})
