import { describe, it, expect, beforeEach } from 'vitest'
import {
  createBoard,
  getBoardById,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createTask,
  updateTask,
  deleteTask,
  getBoards,
} from '@/lib/actions'
import { setupTestDB, clearDB, prisma } from '@/test/lib/test-db'

describe('Server Actions 集成测试', () => {
  setupTestDB()

  beforeEach(async () => {
    await clearDB()
  })

  describe('看板 (Board) 操作', () => {
    it('应该创建一个新看板并包含默认列', async () => {
      const board = await createBoard('集成测试看板')
      
      expect(board).toBeDefined()
      expect(board.id).toBeDefined()
      expect(board.name).toBe('集成测试看板')

      // 验证看板包含默认列
      const boardWithColumns = await getBoardById(board.id)
      expect(boardWithColumns?.columns).toHaveLength(3)
      expect(boardWithColumns?.columns[0].name).toBe('Todo')
      expect(boardWithColumns?.columns[1].name).toBe('Doing')
      expect(boardWithColumns?.columns[2].name).toBe('Done')
    })

    it('应该获取所有看板列表', async () => {
      await createBoard('看板1')
      await createBoard('看板2')
      
      const boards = await getBoards()
      expect(boards.length).toBeGreaterThanOrEqual(2)
    })

    it('应该删除看板及其级联数据', async () => {
      const board = await createBoard('待删除看板')
      
      // 删除看板
      await deleteBoard(board.id)
      
      // 验证看板已删除
      const deletedBoard = await getBoardById(board.id)
      expect(deletedBoard).toBeNull()
      
      // 验证级联删除 - 列也应该被删除
      const columns = await prisma.column.findMany({ where: { boardId: board.id } })
      expect(columns).toHaveLength(0)
    })
  })

  describe('列 (Column) 操作', () => {
    it('应该在看板中创建新列', async () => {
      const board = await createBoard('列测试看板')
      
      // 创建新列 - 使用正确的参数格式
      const column = await createColumn(board.id, '新列')
      
      expect(column).toBeDefined()
      expect(column.name).toBe('新列')
      expect(column.boardId).toBe(board.id)

      // 验证列已添加
      const boardWithColumns = await getBoardById(board.id)
      expect(boardWithColumns?.columns.length).toBe(4) // 3个默认列 + 1个新列
    })

    it('应该更新列名称', async () => {
      const board = await createBoard('更新列测试')
      const boardWithColumns = await getBoardById(board.id)
      const firstColumn = boardWithColumns!.columns[0]

      // 更新列名称
      const updatedColumn = await updateColumn(firstColumn.id, '已更新的列名')
      
      expect(updatedColumn.name).toBe('已更新的列名')
    })

    it('应该删除列', async () => {
      const board = await createBoard('删除列测试')
      const column = await createColumn(board.id, '待删除列')

      // 删除列
      await deleteColumn(column.id)

      // 验证列已删除
      const boardAfterDelete = await getBoardById(board.id)
      const columnExists = boardAfterDelete?.columns.some(c => c.id === column.id)
      expect(columnExists).toBeFalsy()
    })
  })

  describe('任务 (Task) 操作', () => {
    it('应该在列中创建新任务', async () => {
      const board = await createBoard('任务测试看板')
      const boardWithColumns = await getBoardById(board.id)
      const firstColumn = boardWithColumns!.columns[0]

      // 创建任务
      const task = await createTask({
        title: '新任务',
        description: '任务描述',
        columnId: firstColumn.id,
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('新任务')
      expect(task.columnId).toBe(firstColumn.id)
    })

    it('应该更新任务信息', async () => {
      const board = await createBoard('更新任务测试')
      const boardWithColumns = await getBoardById(board.id)
      const firstColumn = boardWithColumns!.columns[0]

      // 创建任务
      const task = await createTask({
        title: '原任务',
        columnId: firstColumn.id,
      })

      // 更新任务
      const updatedTask = await updateTask(task.id, {
        title: '已更新的任务',
        description: '新描述',
      })

      expect(updatedTask.title).toBe('已更新的任务')
      expect(updatedTask.description).toBe('新描述')
    })

    it('应该删除任务', async () => {
      const board = await createBoard('删除任务测试')
      const boardWithColumns = await getBoardById(board.id)
      const firstColumn = boardWithColumns!.columns[0]

      // 创建任务
      const task = await createTask({
        title: '待删除任务',
        columnId: firstColumn.id,
      })

      // 删除任务
      await deleteTask(task.id)

      // 验证任务已删除
      const deletedTask = await prisma.task.findUnique({ where: { id: task.id } })
      expect(deletedTask).toBeNull()
    })

    it('创建任务时应该自动计算排序', async () => {
      const board = await createBoard('任务排序测试')
      const boardWithColumns = await getBoardById(board.id)
      const firstColumn = boardWithColumns!.columns[0]

      // 创建多个任务
      const task1 = await createTask({ title: '任务1', columnId: firstColumn.id })
      const task2 = await createTask({ title: '任务2', columnId: firstColumn.id })
      const task3 = await createTask({ title: '任务3', columnId: firstColumn.id })

      // 验证排序递增
      expect(task1.order).toBe(0)
      expect(task2.order).toBe(1)
      expect(task3.order).toBe(2)
    })
  })

  describe('复杂业务流程集成测试', () => {
    it('完整看板工作流程：创建看板 -> 添加列 -> 创建任务 -> 验证数据一致性', async () => {
      // 1. 创建看板
      const board = await createBoard('完整工作流测试')
      expect(board).toBeDefined()

      // 2. 添加自定义列
      const column = await createColumn(board.id, '开发中')
      expect(column.name).toBe('开发中')

      // 3. 在新列中创建任务
      const task = await createTask({
        title: '设计UI',
        description: '设计登录页面UI',
        columnId: column.id,
      })
      expect(task.title).toBe('设计UI')

      // 4. 更新任务
      const updatedTask = await updateTask(task.id, {
        title: '设计UI界面',
        description: '设计登录和注册页面UI',
      })
      expect(updatedTask.title).toBe('设计UI界面')

      // 5. 验证完整数据结构
      const fullBoard = await getBoardById(board.id)
      expect(fullBoard?.columns.length).toBeGreaterThan(3)
      
      const hasDevColumn = fullBoard?.columns.some(c => c.name === '开发中')
      expect(hasDevColumn).toBeTruthy()
      
      const devColumn = fullBoard?.columns.find(c => c.name === '开发中')
      expect(devColumn?.tasks.some(t => t.title === '设计UI界面')).toBeTruthy()
    })

    it('删除看板时应该级联删除所有列和任务', async () => {
      // 1. 创建看板
      const board = await createBoard('级联删除测试')
      
      // 2. 添加列和任务
      const column = await createColumn(board.id, '测试列')
      await createTask({ title: '测试任务1', columnId: column.id })
      await createTask({ title: '测试任务2', columnId: column.id })

      // 3. 删除看板
      await deleteBoard(board.id)

      // 4. 验证所有数据都被删除
      const deletedBoard = await prisma.board.findUnique({ where: { id: board.id } })
      expect(deletedBoard).toBeNull()

      const columns = await prisma.column.findMany({ where: { boardId: board.id } })
      expect(columns).toHaveLength(0)

      const tasks = await prisma.task.findMany({ 
        where: { column: { boardId: board.id } } 
      })
      expect(tasks).toHaveLength(0)
    })
  })
})
