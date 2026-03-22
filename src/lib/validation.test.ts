import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateTaskTitle,
  validateTaskDescription,
  validateDueDate,
  validateColumnName,
  validateBoardName,
  formatDate,
  isOverdue,
  calculateNewOrder,
  reorderItems,
} from '@/lib/validation'

describe('validateTaskTitle', () => {
  it('should pass for valid title', () => {
    const result = validateTaskTitle('Valid Task Title')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for empty title', () => {
    const result = validateTaskTitle('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Task title cannot be empty')
  })

  it('should fail for whitespace-only title', () => {
    const result = validateTaskTitle('   ')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Task title cannot be empty')
  })

  it('should fail for title exceeding 100 characters', () => {
    const longTitle = 'a'.repeat(101)
    const result = validateTaskTitle(longTitle)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Task title must be 100 characters or less')
  })

  it('should pass for title with exactly 100 characters', () => {
    const title = 'a'.repeat(100)
    const result = validateTaskTitle(title)
    expect(result.valid).toBe(true)
  })

  it('should pass for single character title', () => {
    const result = validateTaskTitle('a')
    expect(result.valid).toBe(true)
  })
})

describe('validateTaskDescription', () => {
  it('should pass for null description', () => {
    const result = validateTaskDescription(null)
    expect(result.valid).toBe(true)
  })

  it('should pass for undefined description', () => {
    const result = validateTaskDescription(undefined)
    expect(result.valid).toBe(true)
  })

  it('should pass for empty string description', () => {
    const result = validateTaskDescription('')
    expect(result.valid).toBe(true)
  })

  it('should pass for valid description', () => {
    const result = validateTaskDescription('This is a valid description')
    expect(result.valid).toBe(true)
  })

  it('should fail for description exceeding 1000 characters', () => {
    const longDescription = 'a'.repeat(1001)
    const result = validateTaskDescription(longDescription)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Task description must be 1000 characters or less')
  })

  it('should pass for description with exactly 1000 characters', () => {
    const description = 'a'.repeat(1000)
    const result = validateTaskDescription(description)
    expect(result.valid).toBe(true)
  })
})

describe('validateDueDate', () => {
  it('should pass for null due date', () => {
    const result = validateDueDate(null)
    expect(result.valid).toBe(true)
  })

  it('should pass for undefined due date', () => {
    const result = validateDueDate(undefined)
    expect(result.valid).toBe(true)
  })

  it('should pass for future due date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const result = validateDueDate(futureDate)
    expect(result.valid).toBe(true)
  })

  it('should pass for today as due date', () => {
    const today = new Date()
    const result = validateDueDate(today)
    expect(result.valid).toBe(true)
  })

  it('should fail for past due date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const result = validateDueDate(pastDate)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Due date cannot be earlier than today')
  })
})

describe('validateColumnName', () => {
  it('should pass for valid column name', () => {
    const result = validateColumnName('Todo')
    expect(result.valid).toBe(true)
  })

  it('should fail for empty column name', () => {
    const result = validateColumnName('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Column name cannot be empty')
  })

  it('should fail for whitespace-only column name', () => {
    const result = validateColumnName('   ')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Column name cannot be empty')
  })

  it('should fail for column name exceeding 50 characters', () => {
    const longName = 'a'.repeat(51)
    const result = validateColumnName(longName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Column name must be 50 characters or less')
  })

  it('should pass for column name with exactly 50 characters', () => {
    const name = 'a'.repeat(50)
    const result = validateColumnName(name)
    expect(result.valid).toBe(true)
  })

  it('should fail for duplicate column name', () => {
    const existingNames = ['Todo', 'Doing', 'Done']
    const result = validateColumnName('Todo', existingNames)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Column name must be unique within the board')
  })

  it('should pass for unique column name', () => {
    const existingNames = ['Todo', 'Doing', 'Done']
    const result = validateColumnName('Backlog', existingNames)
    expect(result.valid).toBe(true)
  })

  it('should be case-sensitive for duplicate check', () => {
    const existingNames = ['Todo']
    const result = validateColumnName('todo', existingNames)
    expect(result.valid).toBe(true)
  })
})

describe('validateBoardName', () => {
  it('should pass for valid board name', () => {
    const result = validateBoardName('My Project Board')
    expect(result.valid).toBe(true)
  })

  it('should fail for empty board name', () => {
    const result = validateBoardName('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Board name cannot be empty')
  })

  it('should fail for whitespace-only board name', () => {
    const result = validateBoardName('   ')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Board name cannot be empty')
  })

  it('should fail for board name exceeding 100 characters', () => {
    const longName = 'a'.repeat(101)
    const result = validateBoardName(longName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Board name must be 100 characters or less')
  })

  it('should pass for board name with exactly 100 characters', () => {
    const name = 'a'.repeat(100)
    const result = validateBoardName(name)
    expect(result.valid).toBe(true)
  })
})

describe('formatDate', () => {
  it('should return empty string for null date', () => {
    expect(formatDate(null)).toBe('')
  })

  it('should return empty string for undefined date', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('should format date correctly', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date)
    expect(result).toBe('Mar 15, 2024')
  })
})

describe('isOverdue', () => {
  it('should return false for null date', () => {
    expect(isOverdue(null)).toBe(false)
  })

  it('should return false for undefined date', () => {
    expect(isOverdue(undefined)).toBe(false)
  })

  it('should return false for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    expect(isOverdue(futureDate)).toBe(false)
  })

  it('should return false for today', () => {
    const today = new Date()
    expect(isOverdue(today)).toBe(false)
  })

  it('should return true for past date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    expect(isOverdue(pastDate)).toBe(true)
  })
})

describe('calculateNewOrder', () => {
  it('should return 0 for empty items', () => {
    const result = calculateNewOrder([], 0)
    expect(result).toBe(0)
  })

  it('should return order before first item when inserting at 0', () => {
    const items = [{ order: 1 }, { order: 2 }, { order: 3 }]
    const result = calculateNewOrder(items, 0)
    expect(result).toBe(0)
  })

  it('should return order after last item when inserting at end', () => {
    const items = [{ order: 1 }, { order: 2 }, { order: 3 }]
    const result = calculateNewOrder(items, 3)
    expect(result).toBe(4)
  })

  it('should return average of adjacent orders when inserting in middle', () => {
    const items = [{ order: 0 }, { order: 2 }, { order: 4 }]
    const result = calculateNewOrder(items, 1)
    expect(result).toBe(1)
  })
})

describe('reorderItems', () => {
  interface TestItem {
    id: string
    order: number
  }

  it('should reorder items correctly', () => {
    const items: TestItem[] = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
      { id: '3', order: 2 },
    ]
    const result = reorderItems(items, 0, 2)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
  })

  it('should update order values after reordering', () => {
    const items: TestItem[] = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
      { id: '3', order: 2 },
    ]
    const result = reorderItems(items, 0, 2)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
    expect(result[2].order).toBe(2)
  })

  it('should not mutate original array', () => {
    const items: TestItem[] = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
    ]
    reorderItems(items, 0, 1)
    expect(items[0].id).toBe('1')
    expect(items[1].id).toBe('2')
  })
})
