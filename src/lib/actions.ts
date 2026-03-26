'use server';

import { revalidatePath } from 'next/cache';

import { db } from './db';

// ================= BOARDS =================

export async function getBoards() {
  return db.board.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export async function getBoardById(id: string) {
  return db.board.findUnique({
    where: { id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: { tags: true },
          },
        },
      },
    },
  });
}

export async function createBoard(name: string) {
  const board = await db.board.create({
    data: {
      name,
      columns: {
        create: [
          { name: 'Todo', order: 0 },
          { name: 'Doing', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
  });
  revalidatePath('/');
  return board;
}

export async function updateBoard(id: string, name: string) {
  const board = await db.board.update({
    where: { id },
    data: { name },
  });
  revalidatePath('/');
  return board;
}

export async function deleteBoard(id: string) {
  await db.board.delete({ where: { id } });
  revalidatePath('/');
}

// ================= COLUMNS =================

export async function createColumn(boardId: string, name: string) {
  const lastColumn = await db.column.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
  });
  const order = lastColumn ? lastColumn.order + 1 : 0;

  const column = await db.column.create({
    data: { name, boardId, order },
  });
  revalidatePath('/');
  return column;
}

export async function updateColumn(id: string, name: string) {
  const column = await db.column.update({
    where: { id },
    data: { name },
  });
  revalidatePath('/');
  return column;
}

export async function deleteColumn(id: string) {
  await db.column.delete({ where: { id } });
  revalidatePath('/');
}

export async function updateColumnOrders(updates: { id: string; order: number }[]) {
  await db.$transaction(
    updates.map((update) =>
      db.column.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    )
  );
  revalidatePath('/');
}

// ================= TASKS =================

export async function createTask(data: {
  title: string;
  description?: string | null;
  columnId: string;
  dueDate?: Date | null;
}) {
  const lastTask = await db.task.findFirst({
    where: { columnId: data.columnId },
    orderBy: { order: 'desc' },
  });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      dueDate: data.dueDate,
      order,
    },
  });
  revalidatePath('/');
  return task;
}

export async function updateTask(
  id: string,
  data: { title?: string; description?: string | null; dueDate?: Date | null; columnId?: string }
) {
  const task = await db.task.update({
    where: { id },
    data,
  });
  revalidatePath('/');
  return task;
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidatePath('/');
}

export async function updateTaskOrders(updates: { id: string; order: number; columnId: string }[]) {
  await db.$transaction(
    updates.map((update) =>
      db.task.update({
        where: { id: update.id },
        data: { order: update.order, columnId: update.columnId },
      })
    )
  );
  revalidatePath('/');
}
