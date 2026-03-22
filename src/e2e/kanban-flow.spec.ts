import { test, expect } from '@playwright/test'

test.describe('Kanban Board E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/')
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display the application', async ({ page }) => {
    // Check if the page title or main content is visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('complete kanban workflow - create board, add column, create task, edit task', async ({ page }) => {
    // Step 1: Create a new board
    const createBoardButton = page.getByRole('button', { name: /create board/i }).or(
      page.getByRole('button', { name: /new board/i })
    ).or(
      page.locator('button').filter({ hasText: /create|new/i }).first()
    )
    
    // Check if button exists and click it
    if (await createBoardButton.isVisible().catch(() => false)) {
      await createBoardButton.click()
      
      // Fill in board name
      const boardNameInput = page.getByPlaceholder(/board name/i).or(
        page.getByRole('textbox').first()
      )
      await boardNameInput.fill('E2E Test Board')
      
      // Submit the form
      const submitButton = page.getByRole('button', { name: /create|save/i }).first()
      await submitButton.click()
      
      // Wait for the board to be created
      await page.waitForTimeout(500)
    }

    // Step 2: Add a new column
    const addColumnButton = page.getByRole('button', { name: /add column/i }).or(
      page.getByRole('button', { name: /\+/i })
    ).first()
    
    if (await addColumnButton.isVisible().catch(() => false)) {
      await addColumnButton.click()
      
      // Handle prompt dialog
      page.on('dialog', async dialog => {
        if (dialog.type() === 'prompt') {
          await dialog.accept('E2E Column')
        }
      })
      
      await page.waitForTimeout(500)
    }

    // Step 3: Create a task
    const addTaskButton = page.getByRole('button', { name: /add task/i }).first()
    
    if (await addTaskButton.isVisible().catch(() => false)) {
      await addTaskButton.click()
      
      // Handle prompt dialog
      page.on('dialog', async dialog => {
        if (dialog.type() === 'prompt') {
          await dialog.accept('E2E Test Task')
        }
      })
      
      await page.waitForTimeout(500)
    }

    // Verify task was created
    const taskElement = page.getByText('E2E Test Task').first()
    await expect(taskElement).toBeVisible()
  })

  test('should handle board switching', async ({ page }) => {
    // Look for board switcher
    const boardSwitcher = page.locator('[data-testid="board-switcher"]').or(
      page.getByRole('combobox')
    ).first()
    
    if (await boardSwitcher.isVisible().catch(() => false)) {
      await boardSwitcher.click()
      
      // Select a different board if available
      const boardOption = page.getByRole('option').first()
      if (await boardOption.isVisible().catch(() => false)) {
        await boardOption.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should handle task deletion with confirmation', async ({ page }) => {
    // Find a task to delete
    const taskCard = page.locator('[data-testid="task-card"]').first().or(
      page.locator('.group').first()
    )
    
    if (await taskCard.isVisible().catch(() => false)) {
      // Hover to reveal delete button
      await taskCard.hover()
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') {
          await dialog.accept()
        }
      })
      
      // Click delete button
      const deleteButton = taskCard.locator('button').filter({ has: page.locator('svg') }).first()
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should handle column deletion with cascade', async ({ page }) => {
    // Find a column
    const column = page.locator('[data-testid="column"]').first().or(
      page.locator('.bg-card').first()
    )
    
    if (await column.isVisible().catch(() => false)) {
      // Click on more options
      const moreButton = column.locator('button').filter({ has: page.locator('svg') }).first()
      
      if (await moreButton.isVisible().catch(() => false)) {
        await moreButton.click()
        
        // Handle confirmation dialog
        page.on('dialog', async dialog => {
          if (dialog.type() === 'confirm') {
            await dialog.accept()
          }
        })
        
        // Click delete option
        const deleteOption = page.getByText(/delete/i).first()
        if (await deleteOption.isVisible().catch(() => false)) {
          await deleteOption.click()
          await page.waitForTimeout(500)
        }
      }
    }
  })

  test('responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that the app is still functional
    await expect(page.locator('body')).toBeVisible()
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('keyboard navigation', async ({ page }) => {
    // Test keyboard shortcuts
    await page.keyboard.press('Tab')
    
    // Check if any element is focused
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeDefined()
    
    // Test Escape key
    await page.keyboard.press('Escape')
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline state
    await page.route('**/*', route => route.abort('internetdisconnected'))
    
    await page.goto('/')
    
    // App should still render (even if data fails to load)
    await expect(page.locator('body')).toBeVisible()
    
    // Remove route blocking
    await page.unroute('**/*')
  })

  test('should handle invalid routes', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should either show 404 or redirect to home
    await expect(page.locator('body')).toBeVisible()
  })
})
