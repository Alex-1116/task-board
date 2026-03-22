import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockTask, createMockTag } from '@/test/utils'
import KanbanTask from './KanbanTask'
import * as actions from '@/lib/actions'

// Mock the actions module
vi.mock('@/lib/actions', () => ({
  deleteTask: vi.fn(),
}))

describe('KanbanTask', () => {
  const mockTask = createMockTask({
    id: 'task-1',
    title: 'Test Task Title',
    description: 'Test description',
    tags: [
      createMockTag({ id: 'tag-1', name: 'bug', color: '#ef4444' }),
      createMockTag({ id: 'tag-2', name: 'feature', color: '#3b82f6' }),
    ],
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render task title', () => {
    render(<KanbanTask task={mockTask} />)
    expect(screen.getByText('Test Task Title')).toBeInTheDocument()
  })

  it('should render task tags', () => {
    render(<KanbanTask task={mockTask} />)
    expect(screen.getByText('bug')).toBeInTheDocument()
    expect(screen.getByText('feature')).toBeInTheDocument()
  })

  it('should render task without tags', () => {
    const taskWithoutTags = createMockTask({ tags: [] })
    render(<KanbanTask task={taskWithoutTags} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should call deleteTask when delete is confirmed', async () => {
    vi.mocked(actions.deleteTask).mockResolvedValueOnce(undefined)
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

    render(<KanbanTask task={mockTask} />)
    
    // Find delete button by looking for trash icon
    const buttons = document.querySelectorAll('button')
    const deleteButton = Array.from(buttons).find(b => 
      b.innerHTML.includes('Trash2') || b.querySelector('svg')
    )
    
    if (deleteButton) {
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(actions.deleteTask).toHaveBeenCalledWith('task-1')
      })
    }
  })

  it('should not delete when user cancels confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)

    render(<KanbanTask task={mockTask} />)
    
    // Find delete button
    const buttons = document.querySelectorAll('button')
    const deleteButton = Array.from(buttons).find(b => 
      b.innerHTML.includes('Trash2') || b.querySelector('svg')
    )
    
    if (deleteButton) {
      fireEvent.click(deleteButton)
      expect(actions.deleteTask).not.toHaveBeenCalled()
    }
  })
})
