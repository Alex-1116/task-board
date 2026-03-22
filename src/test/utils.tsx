import React, { ReactElement } from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'

// Custom render function with providers
function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DndContext>
        {children}
      </DndContext>
    )
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { render }

// Test data factories
export const createMockBoard = (overrides = {}) => ({
  id: 'board-1',
  name: 'Test Board',
  createdAt: new Date(),
  updatedAt: new Date(),
  columns: [],
  ...overrides,
})

export const createMockColumn = (overrides = {}) => ({
  id: 'column-1',
  name: 'Todo',
  order: 0,
  boardId: 'board-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [],
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  order: 0,
  dueDate: null,
  columnId: 'column-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  ...overrides,
})

export const createMockTag = (overrides = {}) => ({
  id: 'tag-1',
  name: 'bug',
  color: '#ef4444',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})
