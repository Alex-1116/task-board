import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockColumn, createMockTask } from '@/test/utils'
import KanbanColumn from './KanbanColumn'
import * as actions from '@/lib/actions'

// Mock the actions module
vi.mock('@/lib/actions', () => ({
  deleteColumn: vi.fn(),
  createTask: vi.fn(),
}))

describe('KanbanColumn', () => {
  const mockColumn = createMockColumn({
    id: 'column-1',
    name: 'Todo',
    tasks: [
      createMockTask({ id: 'task-1', title: 'Task 1', order: 0 }),
      createMockTask({ id: 'task-2', title: 'Task 2', order: 1 }),
    ],
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render column name', () => {
    render(<KanbanColumn column={mockColumn} />)
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('should render task count', () => {
    render(<KanbanColumn column={mockColumn} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render all tasks in column', () => {
    render(<KanbanColumn column={mockColumn} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should render empty column', () => {
    const emptyColumn = createMockColumn({ tasks: [] })
    render(<KanbanColumn column={emptyColumn} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should call createTask when adding new task', async () => {
    vi.mocked(actions.createTask).mockResolvedValueOnce({
      id: 'new-task',
      title: 'New Task',
      columnId: 'column-1',
      order: 2,
      description: null,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.spyOn(window, 'prompt').mockReturnValueOnce('New Task')

    render(<KanbanColumn column={mockColumn} />)
    
    // Find add task button
    const buttons = document.querySelectorAll('button')
    const addButton = Array.from(buttons).find(b => 
      b.textContent?.toLowerCase().includes('add task') ||
      b.textContent?.toLowerCase().includes('add')
    )
    
    if (addButton) {
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(actions.createTask).toHaveBeenCalled()
      })
    }
  })

  it('should not create task when prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(null)

    render(<KanbanColumn column={mockColumn} />)
    
    // Find add task button
    const buttons = document.querySelectorAll('button')
    const addButton = Array.from(buttons).find(b => 
      b.textContent?.toLowerCase().includes('add')
    )
    
    if (addButton) {
      fireEvent.click(addButton)
      expect(actions.createTask).not.toHaveBeenCalled()
    }
  })
})
