import { describe, it, expect } from 'vitest'

// Validation functions based on requirements
export const validateTask = (task: {
  title: string
  description?: string | null
  dueDate?: Date | null
}) => {
  const errors: string[] = []

  // 标题：1-100个字符，不能为空
  if (!task.title || task.title.trim().length === 0) {
    errors.push('标题不能为空')
  } else if (task.title.length > 100) {
    errors.push('标题不能超过100个字符')
  } else if (task.title.length < 1) {
    errors.push('标题至少需要1个字符')
  }

  // 描述：最多1000个字符
  if (task.description && task.description.length > 1000) {
    errors.push('描述不能超过1000个字符')
  }

  // 截止日期：不能早于当前日期
  if (task.dueDate) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    if (dueDate < now) {
      errors.push('截止日期不能早于当前日期')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateColumn = (column: {
  name: string
}, existingColumns: { name: string }[] = []) => {
  const errors: string[] = []

  // 列名：1-50个字符，不能为空
  if (!column.name || column.name.trim().length === 0) {
    errors.push('列名不能为空')
  } else if (column.name.length > 50) {
    errors.push('列名不能超过50个字符')
  } else if (column.name.length < 1) {
    errors.push('列名至少需要1个字符')
  }

  // 同一看板下列名不能重复
  const isDuplicate = existingColumns.some(
    (c) => c.name.toLowerCase() === column.name.toLowerCase()
  )
  if (isDuplicate) {
    errors.push('列名已存在')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateBoard = (board: { name: string }) => {
  const errors: string[] = []

  // 看板名：1-100个字符，不能为空
  if (!board.name || board.name.trim().length === 0) {
    errors.push('看板名不能为空')
  } else if (board.name.length > 100) {
    errors.push('看板名不能超过100个字符')
  } else if (board.name.length < 1) {
    errors.push('看板名至少需要1个字符')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

describe('Task Validation', () => {
  it('should validate valid task', () => {
    const result = validateTask({
      title: 'Valid Task',
      description: 'Valid description',
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject empty title', () => {
    const result = validateTask({ title: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('标题不能为空')
  })

  it('should reject title with only whitespace', () => {
    const result = validateTask({ title: '   ' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('标题不能为空')
  })

  it('should reject title longer than 100 characters', () => {
    const result = validateTask({ title: 'a'.repeat(101) })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('标题不能超过100个字符')
  })

  it('should accept title with exactly 100 characters', () => {
    const result = validateTask({ title: 'a'.repeat(100) })
    expect(result.isValid).toBe(true)
  })

  it('should reject description longer than 1000 characters', () => {
    const result = validateTask({
      title: 'Valid',
      description: 'a'.repeat(1001),
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('描述不能超过1000个字符')
  })

  it('should reject due date in the past', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = validateTask({
      title: 'Valid',
      dueDate: yesterday,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('截止日期不能早于当前日期')
  })

  it('should accept due date today', () => {
    const today = new Date()
    const result = validateTask({
      title: 'Valid',
      dueDate: today,
    })
    expect(result.isValid).toBe(true)
  })

  it('should accept due date in the future', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const result = validateTask({
      title: 'Valid',
      dueDate: tomorrow,
    })
    expect(result.isValid).toBe(true)
  })

  it('should accept null description', () => {
    const result = validateTask({
      title: 'Valid',
      description: null,
    })
    expect(result.isValid).toBe(true)
  })

  it('should accept undefined description', () => {
    const result = validateTask({
      title: 'Valid',
    })
    expect(result.isValid).toBe(true)
  })
})

describe('Column Validation', () => {
  it('should validate valid column', () => {
    const result = validateColumn({ name: 'Todo' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject empty column name', () => {
    const result = validateColumn({ name: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('列名不能为空')
  })

  it('should reject column name longer than 50 characters', () => {
    const result = validateColumn({ name: 'a'.repeat(51) })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('列名不能超过50个字符')
  })

  it('should accept column name with exactly 50 characters', () => {
    const result = validateColumn({ name: 'a'.repeat(50) })
    expect(result.isValid).toBe(true)
  })

  it('should reject duplicate column names (case insensitive)', () => {
    const existingColumns = [{ name: 'Todo' }]
    const result = validateColumn({ name: 'TODO' }, existingColumns)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('列名已存在')
  })

  it('should accept unique column name', () => {
    const existingColumns = [{ name: 'Todo' }]
    const result = validateColumn({ name: 'Doing' }, existingColumns)
    expect(result.isValid).toBe(true)
  })
})

describe('Board Validation', () => {
  it('should validate valid board', () => {
    const result = validateBoard({ name: 'My Board' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject empty board name', () => {
    const result = validateBoard({ name: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('看板名不能为空')
  })

  it('should reject board name longer than 100 characters', () => {
    const result = validateBoard({ name: 'a'.repeat(101) })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('看板名不能超过100个字符')
  })

  it('should accept board name with exactly 100 characters', () => {
    const result = validateBoard({ name: 'a'.repeat(100) })
    expect(result.isValid).toBe(true)
  })
})
