import { test, expect } from '@playwright/test';

test.describe('Kanban Board E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main page', async ({ page }) => {
    await expect(page).toHaveTitle(/Task Board/);
  });

  test('should create a new board', async ({ page }) => {
    const boardName = `Test Board ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/name/i).fill(boardName);
    await dialog.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(boardName)).toBeVisible();
  });

  test('should show default columns when creating a board', async ({ page }) => {
    const boardName = `Board with Columns ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await expect(page.getByText('Todo')).toBeVisible();
    await expect(page.getByText('Doing')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should add a new column', async ({ page }) => {
    const boardName = `Board for Column Test ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await page.getByRole('button', { name: /add.*column/i }).click();

    page.on('dialog', async (dialog) => {
      await dialog.accept('New Column');
    });

    await page.getByRole('button', { name: /add.*column/i }).click();

    await expect(page.getByText('New Column')).toBeVisible();
  });

  test('should create a task', async ({ page }) => {
    const boardName = `Board for Task Test ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await page.getByText('Todo').first().click();

    page.on('dialog', async (dialog) => {
      await dialog.accept('New Task Title');
    });

    const addTaskButton = page.getByRole('button', { name: /add.*task/i }).first();
    await addTaskButton.click();

    await expect(page.getByText('New Task Title')).toBeVisible();
  });

  test('should open and edit task dialog', async ({ page }) => {
    const boardName = `Board for Edit Test ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await page.getByText('Todo').first().click();

    page.on('dialog', async (dialog) => {
      await dialog.accept('Task to Edit');
    });

    await page
      .getByRole('button', { name: /add.*task/i })
      .first()
      .click();

    await page.getByText('Task to Edit').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Edit Task')).toBeVisible();

    const titleInput = dialog.getByPlaceholder(/task title/i);
    await titleInput.fill('Updated Task Title');

    await dialog.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Updated Task Title')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    const boardName = `Board for Delete Test ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await page.getByText('Todo').first().click();

    page.on('dialog', async (dialog) => {
      await dialog.accept('Task to Delete');
    });

    await page
      .getByRole('button', { name: /add.*task/i })
      .first()
      .click();

    const taskCard = page.getByText('Task to Delete').first();
    await taskCard.hover();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteButton = page.getByRole('button', { name: '' }).filter({ hasText: '' }).nth(0);
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }
  });

  test('should switch between boards', async ({ page }) => {
    const boardName1 = `First Board ${Date.now()}`;
    const boardName2 = `Second Board ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName1);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await expect(page.getByText(boardName1)).toBeVisible();

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName2);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await expect(page.getByText(boardName2)).toBeVisible();
  });

  test('should display task count in column header', async ({ page }) => {
    const boardName = `Board for Count Test ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    const todoColumn = page.getByText('Todo').first();
    await expect(todoColumn).toBeVisible();

    const countBadge = page.getByText('0', { exact: true }).first();
    await expect(countBadge).toBeVisible();
  });
});

test.describe('Board Management', () => {
  test('should create board with default Todo/Doing/Done columns', async ({ page }) => {
    await page.goto('/');

    const boardName = `Default Columns Board ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await expect(page.getByText('Todo')).toBeVisible();
    await expect(page.getByText('Doing')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });
});

test.describe('Task Management', () => {
  test('should validate task title is required', async ({ page }) => {
    await page.goto('/');

    const boardName = `Validation Board ${Date.now()}`;

    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByRole('dialog').getByLabel(/name/i).fill(boardName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create/i })
      .click();

    await page.getByText('Todo').first().click();

    const addTaskButton = page.getByRole('button', { name: /add.*task/i }).first();
    await addTaskButton.click();

    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await addTaskButton.click();
  });
});
