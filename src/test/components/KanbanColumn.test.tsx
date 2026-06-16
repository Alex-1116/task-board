import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KanbanColumn from '@/components/KanbanColumn'
import { ColumnWithTasks } from '@/types'

const mockColumn: ColumnWithTasks = {
  id: 'test-column-id',
  name: 'Todo',
  order: 0,
  boardId: 'test-board-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [
    {
      id: 'task1',
      title: 'Task 1',
      description: null,
      order: 0,
      dueDate: null,
      columnId: 'test-column-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    },
    {
      id: 'task2',
      title: 'Task 2',
      description: null,
      order: 1,
      dueDate: null,
      columnId: 'test-column-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    },
  ],
}

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    setNodeRef: vi.fn(),
    attributes: {},
    listeners: {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock actions
vi.mock('@/lib/actions', () => ({
  deleteColumn: vi.fn(),
  createTask: vi.fn(),
}))

// Mock KanbanTask component
vi.mock('@/components/KanbanTask', () => ({
  default: ({ task }: { task: any }) => (
    <div data-testid={`kanban-task-${task.id}`}>{task.title}</div>
  ),
}))

describe('KanbanColumn 组件', () => {
  it('应该正确渲染列名称和任务数量', () => {
    render(<KanbanColumn column={mockColumn} />)

    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // 任务数量徽章
  })

  it('应该正确渲染所有任务', () => {
    render(<KanbanColumn column={mockColumn} />)

    expect(screen.getByTestId('kanban-task-task1')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-task-task2')).toBeInTheDocument()
  })

  it('点击添加任务按钮应该触发创建任务', async () => {
    const { createTask } = await import('@/lib/actions')
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Task')

    render(<KanbanColumn column={mockColumn} />)

    const addButton = screen.getByRole('button', { name: /add task/i })
    fireEvent.click(addButton)

    expect(promptSpy).toHaveBeenCalledWith('Task title:')
    expect(createTask).toHaveBeenCalledWith({
      title: 'New Task',
      columnId: 'test-column-id',
    })
  })

  it('点击删除列应该触发删除操作', async () => {
    const { deleteColumn } = await import('@/lib/actions')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<KanbanColumn column={mockColumn} />)

    // 找到所有按钮，然后通过图标或类名来识别菜单触发器
    const buttons = screen.getAllByRole('button')
    // 菜单触发器通常包含 MoreHorizontal 图标
    const menuTrigger = buttons.find(btn => {
      const html = btn.innerHTML
      return html.includes('more') || html.includes('More') || html.includes('ellipsis') || html.includes('dots')
    })
    
    expect(menuTrigger).toBeDefined()
    fireEvent.click(menuTrigger!)

    // 点击删除选项
    await waitFor(() => {
      const deleteOption = screen.getByText('Delete Column')
      fireEvent.click(deleteOption)
    })

    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete this column and all its tasks?'
    )
    expect(deleteColumn).toHaveBeenCalledWith('test-column-id')
  })

  it('应该显示列标题的拖拽手柄', () => {
    render(<KanbanColumn column={mockColumn} />)

    const header = screen.getByText('Todo').closest('div[class*="cursor-grab"]')
    expect(header).toBeInTheDocument()
  })
})
