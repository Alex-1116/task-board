import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn 函数测试', () => {
  it('应该正确合并多个类名', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('应该正确处理条件类名', () => {
    const result = cn('class1', { 'class2': true, 'class3': false })
    expect(result).toBe('class1 class2')
  })

  it('应该正确处理 Tailwind 合并', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('应该正确处理复杂的类名合并', () => {
    const result = cn(
      'bg-red-500',
      'text-white',
      { 'font-bold': true },
      ['p-4', 'rounded']
    )
    expect(result).toContain('bg-red-500 text-white font-bold p-4 rounded')
  })

  it('应该正确处理空值', () => {
    const result = cn('class1', null, undefined, false, 'class2')
    expect(result).toBe('class1 class2')
  })
})
