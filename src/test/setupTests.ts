import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
