export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateTaskTitle(title: string): ValidationResult {
  const errors: string[] = []
  
  if (!title || title.trim().length === 0) {
    errors.push('Task title cannot be empty')
  }
  
  if (title.length > 100) {
    errors.push('Task title must be 100 characters or less')
  }
  
  if (title.length > 0 && title.trim().length === 0) {
    errors.push('Task title cannot be only whitespace')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateTaskDescription(description: string | null | undefined): ValidationResult {
  const errors: string[] = []
  
  if (description && description.length > 1000) {
    errors.push('Task description must be 1000 characters or less')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateDueDate(dueDate: Date | null | undefined): ValidationResult {
  const errors: string[] = []
  
  if (dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDateOnly = new Date(dueDate)
    dueDateOnly.setHours(0, 0, 0, 0)
    
    if (dueDateOnly < today) {
      errors.push('Due date cannot be earlier than today')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateColumnName(name: string, existingNames: string[] = []): ValidationResult {
  const errors: string[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push('Column name cannot be empty')
  }
  
  if (name.length > 50) {
    errors.push('Column name must be 50 characters or less')
  }
  
  if (name.trim().length > 0 && existingNames.includes(name.trim())) {
    errors.push('Column name must be unique within the board')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateBoardName(name: string): ValidationResult {
  const errors: string[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push('Board name cannot be empty')
  }
  
  if (name.length > 100) {
    errors.push('Board name must be 100 characters or less')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

export function calculateNewOrder(items: { order: number }[], insertIndex: number): number {
  if (items.length === 0) return 0
  
  if (insertIndex === 0) {
    return items[0].order - 1
  }
  
  if (insertIndex >= items.length) {
    return items[items.length - 1].order + 1
  }
  
  const prevOrder = items[insertIndex - 1].order
  const nextOrder = items[insertIndex].order
  return (prevOrder + nextOrder) / 2
}

export function reorderItems<T extends { id: string; order: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...items]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result.map((item, index) => ({ ...item, order: index }))
}
