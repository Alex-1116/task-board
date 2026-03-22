import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KanbanTask from '@/components/KanbanTask'
import { TaskWithTags } from '@/types'

const mockTask: TaskWithTags = {
  id: 'test-task-id',
  title: 'Test Task',
  description: 'Test Description',
  order: 0,
  dueDate: null,
  columnId: 'test-column-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
}

const mockTaskWithTags: TaskWithTags = {
  ...mockTask,
  tags: [
    {
      id: 'tag1',
      name: 'Urgent',
      color: '#ef4444',
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    },
  ],
}

const mockTaskWithDueDate: TaskWithTags = {
  ...mockTask,
  dueDate: new Date('2024-12-31'),
}

// Mock useSortable hook
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock deleteTask action
vi.mock('@/lib/actions', () => ({
  deleteTask: vi.fn(),
}))

describe('KanbanTask 组件', () => {
  it('应该正确渲染任务标题', () => {
    render(<KanbanTask task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('应该正确渲染标签', () => {
    render(<KanbanTask task={mockTaskWithTags} />)
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('应该正确渲染截止日期', () => {
    render(<KanbanTask task={mockTaskWithDueDate} />)
    expect(screen.getByText('12/31/2024')).toBeInTheDocument()
  })

  it('应该显示删除按钮并触发删除操作', async () => {
    const { deleteTask } = await import('@/lib/actions')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<KanbanTask task={mockTask} />)

    // Hover to show delete button - 找到 Card 元素
    const card = screen.getByText('Test Task').closest('div[class*="group"]')
    fireEvent.mouseEnter(card!)

    // 查找 Trash2 图标按钮（通过图标或类名）
    const deleteButtons = screen.getAllByRole('button').filter(btn => {
      const html = btn.innerHTML
      return html.includes('trash') || html.includes('Trash') || html.includes('delete') || btn.className.includes('text-destructive')
    })
    
    expect(deleteButtons.length).toBeGreaterThan(0)
    const deleteButton = deleteButtons[0]

    fireEvent.click(deleteButton!)
    expect(confirmSpy).toHaveBeenCalledWith('Delete this task?')
    expect(deleteTask).toHaveBeenCalledWith('test-task-id')
  })

  it('点击任务卡片应该打开任务详情对话框', async () => {
    render(<KanbanTask task={mockTask} />)

    const card = screen.getByText('Test Task')
    fireEvent.click(card)

    // 对话框应该出现
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
