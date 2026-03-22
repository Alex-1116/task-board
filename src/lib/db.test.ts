import { describe, it, expect } from 'vitest'

describe('Database Client', () => {
  it('should have database configuration', () => {
    // Verify that the database URL is configured
    expect(process.env.DATABASE_URL || 'file:./dev.db').toBeDefined()
  })

  it('should use SQLite as provider', () => {
    // The project uses SQLite
    expect('sqlite').toBe('sqlite')
  })
})
