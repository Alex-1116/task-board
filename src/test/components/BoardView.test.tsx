import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoardView from '@/components/BoardView'
import { BoardWithColumns } from '@/types'

const mockBoard: BoardWithColumns = {
  id: 'test-board-id',
  name: 'Test Board',
  createdAt: new Date(),
  updatedAt: new Date(),
  columns: [
    {
      id: 'col1',
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
          columnId: 'col1',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ],
    },
    {
      id: 'col2',
      name: 'Doing',
      order: 1,
      boardId: 'test-board-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    },
  ],
}

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
  closestCorners: {},
  KeyboardSensor: {},
  PointerSensor: {},
  useSensor: () => ({}),
  useSensors: () => [],
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  arrayMove: (arr: any[], from: number, to: number) => arr,
  sortableKeyboardCoordinates: {},
  horizontalListSortingStrategy: {},
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
  createColumn: vi.fn(),
  updateColumnOrders: vi.fn(),
  updateTaskOrders: vi.fn(),
}))

// Mock KanbanColumn component
vi.mock('@/components/KanbanColumn', () => ({
  default: ({ column }: { column: any }) => (
    <div data-testid={`kanban-column-${column.id}`}>
      <div>{column.name}</div>
      <div>
        {column.tasks.map((task: any) => (
          <div key={task.id}>{task.title}</div>
        ))}
      </div>
    </div>
  ),
}))

describe('BoardView 组件', () => {
  it('应该正确渲染看板中的列', () => {
    render(<BoardView board={mockBoard} />)

    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Doing')).toBeInTheDocument()
  })

  it('应该正确渲染所有列', () => {
    render(<BoardView board={mockBoard} />)

    expect(screen.getByTestId('kanban-column-col1')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-col2')).toBeInTheDocument()
  })

  it('应该渲染添加列按钮', () => {
    render(<BoardView board={mockBoard} />)

    expect(screen.getByRole('button', { name: /add column/i })).toBeInTheDocument()
  })

  it('点击添加列按钮应该触发创建列', async () => {
    const { createColumn } = await import('@/lib/actions')
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Column')

    render(<BoardView board={mockBoard} />)

    const addButton = screen.getByRole('button', { name: /add column/i })
    fireEvent.click(addButton)

    expect(promptSpy).toHaveBeenCalledWith('Column name:')
    expect(createColumn).toHaveBeenCalledWith('test-board-id', 'New Column')
  })

  it('应该渲染列中的任务', () => {
    render(<BoardView board={mockBoard} />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('应该处理空看板', () => {
    const emptyBoard = { ...mockBoard, columns: [] }
    render(<BoardView board={emptyBoard} />)

    expect(
      screen.getByRole('button', { name: /add column/i })
    ).toBeInTheDocument()
  })
})
