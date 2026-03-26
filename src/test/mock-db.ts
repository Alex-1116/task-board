import { vi } from 'vitest';
import { Board, Column, Task, Tag } from '@/generated/client';

export type MockBoard = Board;
export type MockColumn = Column;
export type MockTask = Task;
export type MockTag = Tag;

export function createMockBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    name: 'Test Board',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: 'column-1',
    name: 'Todo',
    order: 0,
    boardId: 'board-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    description: null,
    order: 0,
    dueDate: null,
    columnId: 'column-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    name: 'Feature',
    color: '#3b82f6',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockDb() {
  const boards: Board[] = [];
  const columns: Column[] = [];
  const tasks: Task[] = [];
  const tags: Tag[] = [];

  return {
    boards,
    columns,
    tasks,
    tags,
    reset() {
      boards.length = 0;
      columns.length = 0;
      tasks.length = 0;
      tags.length = 0;
    },
    board: {
      findMany: vi.fn(async () => boards),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          boards.find((b) => b.id === where.id) || null
      ),
      create: vi.fn(async ({ data }: { data: { name: string } }) => {
        const board: Board = {
          id: `board-${Date.now()}`,
          name: data.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        boards.push(board);
        return board;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { name?: string } }) => {
        const board = boards.find((b) => b.id === where.id);
        if (!board) throw new Error('Board not found');
        if (data.name) board.name = data.name;
        board.updatedAt = new Date();
        return board;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = boards.findIndex((b) => b.id === where.id);
        if (index === -1) throw new Error('Board not found');
        const [deleted] = boards.splice(index, 1);
        const colsToDelete = columns.filter((c) => c.boardId === where.id);
        colsToDelete.forEach((col) => {
          const taskIndex = tasks.findIndex((t) => t.columnId === col.id);
          while (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);
          }
        });
        columns.splice(0, columns.length, ...columns.filter((c) => c.boardId !== where.id));
        return deleted;
      }),
    },
    column: {
      findFirst: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where?: { boardId?: string };
          orderBy?: { order: 'asc' | 'desc' };
        }) => {
          let filtered = columns;
          if (where?.boardId) {
            filtered = filtered.filter((c) => c.boardId === where.boardId);
          }
          if (orderBy?.order === 'desc') {
            return filtered.sort((a, b) => b.order - a.order)[0] || null;
          }
          return filtered.sort((a, b) => a.order - b.order)[0] || null;
        }
      ),
      create: vi.fn(
        async ({ data }: { data: { name: string; boardId: string; order: number } }) => {
          const column: Column = {
            id: `column-${Date.now()}`,
            name: data.name,
            order: data.order,
            boardId: data.boardId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          columns.push(column);
          return column;
        }
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { name?: string; order?: number };
        }) => {
          const column = columns.find((c) => c.id === where.id);
          if (!column) throw new Error('Column not found');
          if (data.name !== undefined) column.name = data.name;
          if (data.order !== undefined) column.order = data.order;
          column.updatedAt = new Date();
          return column;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = columns.findIndex((c) => c.id === where.id);
        if (index === -1) throw new Error('Column not found');
        const [deleted] = columns.splice(index, 1);
        const taskIndex = tasks.findIndex((t) => t.columnId === where.id);
        while (taskIndex !== -1) {
          tasks.splice(taskIndex, 1);
        }
        return deleted;
      }),
    },
    task: {
      findFirst: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where?: { columnId?: string };
          orderBy?: { order: 'asc' | 'desc' };
        }) => {
          let filtered = tasks;
          if (where?.columnId) {
            filtered = filtered.filter((t) => t.columnId === where.columnId);
          }
          if (orderBy?.order === 'desc') {
            return filtered.sort((a, b) => b.order - a.order)[0] || null;
          }
          return filtered.sort((a, b) => a.order - b.order)[0] || null;
        }
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            title: string;
            description?: string | null;
            columnId: string;
            dueDate?: Date | null;
            order: number;
          };
        }) => {
          const task: Task = {
            id: `task-${Date.now()}`,
            title: data.title,
            description: data.description ?? null,
            order: data.order,
            dueDate: data.dueDate ?? null,
            columnId: data.columnId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          tasks.push(task);
          return task;
        }
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: {
            title?: string;
            description?: string | null;
            dueDate?: Date | null;
            order?: number;
            columnId?: string;
          };
        }) => {
          const task = tasks.find((t) => t.id === where.id);
          if (!task) throw new Error('Task not found');
          if (data.title !== undefined) task.title = data.title;
          if (data.description !== undefined) task.description = data.description;
          if (data.dueDate !== undefined) task.dueDate = data.dueDate;
          if (data.order !== undefined) task.order = data.order;
          if (data.columnId !== undefined) task.columnId = data.columnId;
          task.updatedAt = new Date();
          return task;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = tasks.findIndex((t) => t.id === where.id);
        if (index === -1) throw new Error('Task not found');
        const [deleted] = tasks.splice(index, 1);
        return deleted;
      }),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => {
      return Promise.all(operations);
    }),
  };
}

export type MockDb = ReturnType<typeof createMockDb>;
