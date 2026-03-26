import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    board: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    column: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  updateColumnOrders,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrders,
} from "@/lib/actions";
import { db } from "@/lib/db";

const mockDb = db as unknown as {
  board: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  column: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  task: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("Board Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBoards", () => {
    it("should return all boards ordered by createdAt", async () => {
      const mockBoards = [
        {
          id: "1",
          name: "Board 1",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "2",
          name: "Board 2",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];
      mockDb.board.findMany.mockResolvedValue(mockBoards);

      const result = await getBoards();

      expect(mockDb.board.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "asc" },
      });
      expect(result).toEqual(mockBoards);
    });
  });

  describe("getBoardById", () => {
    it("should return board with columns and tasks", async () => {
      const mockBoard = {
        id: "1",
        name: "Test Board",
        createdAt: new Date(),
        updatedAt: new Date(),
        columns: [
          {
            id: "col-1",
            name: "Todo",
            order: 0,
            boardId: "1",
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: [
              {
                id: "task-1",
                title: "Task 1",
                description: null,
                order: 0,
                dueDate: null,
                columnId: "col-1",
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: [],
              },
            ],
          },
        ],
      };
      mockDb.board.findUnique.mockResolvedValue(mockBoard);

      const result = await getBoardById("1");

      expect(mockDb.board.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          columns: {
            orderBy: { order: "asc" },
            include: {
              tasks: {
                orderBy: { order: "asc" },
                include: { tags: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockBoard);
    });

    it("should return null for non-existent board", async () => {
      mockDb.board.findUnique.mockResolvedValue(null);

      const result = await getBoardById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createBoard", () => {
    it("should create board with default columns", async () => {
      const mockBoard = {
        id: "new-board",
        name: "New Board",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.board.create.mockResolvedValue(mockBoard);

      const result = await createBoard("New Board");

      expect(mockDb.board.create).toHaveBeenCalledWith({
        data: {
          name: "New Board",
          columns: {
            create: [
              { name: "Todo", order: 0 },
              { name: "Doing", order: 1 },
              { name: "Done", order: 2 },
            ],
          },
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(result).toEqual(mockBoard);
    });
  });

  describe("updateBoard", () => {
    it("should update board name", async () => {
      const mockBoard = {
        id: "1",
        name: "Updated Name",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.board.update.mockResolvedValue(mockBoard);

      const result = await updateBoard("1", "Updated Name");

      expect(mockDb.board.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { name: "Updated Name" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(result).toEqual(mockBoard);
    });
  });

  describe("deleteBoard", () => {
    it("should delete board", async () => {
      mockDb.board.delete.mockResolvedValue({ id: "1" });

      await deleteBoard("1");

      expect(mockDb.board.delete).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });
});

describe("Column Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createColumn", () => {
    it("should create column with correct order", async () => {
      mockDb.column.findFirst.mockResolvedValue({ order: 2 });
      mockDb.column.create.mockResolvedValue({
        id: "new-col",
        name: "New Column",
        order: 3,
        boardId: "board-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createColumn("board-1", "New Column");

      expect(mockDb.column.findFirst).toHaveBeenCalledWith({
        where: { boardId: "board-1" },
        orderBy: { order: "desc" },
      });
      expect(mockDb.column.create).toHaveBeenCalledWith({
        data: { name: "New Column", boardId: "board-1", order: 3 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(result.name).toBe("New Column");
    });

    it("should create first column with order 0", async () => {
      mockDb.column.findFirst.mockResolvedValue(null);
      mockDb.column.create.mockResolvedValue({
        id: "new-col",
        name: "First Column",
        order: 0,
        boardId: "board-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createColumn("board-1", "First Column");

      expect(result.order).toBe(0);
    });
  });

  describe("updateColumn", () => {
    it("should update column name", async () => {
      mockDb.column.update.mockResolvedValue({
        id: "col-1",
        name: "Updated Column",
        order: 0,
        boardId: "board-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await updateColumn("col-1", "Updated Column");

      expect(mockDb.column.update).toHaveBeenCalledWith({
        where: { id: "col-1" },
        data: { name: "Updated Column" },
      });
      expect(result.name).toBe("Updated Column");
    });
  });

  describe("deleteColumn", () => {
    it("should delete column", async () => {
      mockDb.column.delete.mockResolvedValue({ id: "col-1" });

      await deleteColumn("col-1");

      expect(mockDb.column.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });

  describe("updateColumnOrders", () => {
    it("should update multiple column orders in transaction", async () => {
      const updates = [
        { id: "col-1", order: 1 },
        { id: "col-2", order: 0 },
      ];
      mockDb.$transaction.mockResolvedValue([{}, {}]);
      mockDb.column.update.mockResolvedValue({});

      await updateColumnOrders(updates);

      expect(mockDb.$transaction).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });
});

describe("Task Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create task with correct order", async () => {
      mockDb.task.findFirst.mockResolvedValue({ order: 5 });
      mockDb.task.create.mockResolvedValue({
        id: "new-task",
        title: "New Task",
        description: null,
        order: 6,
        dueDate: null,
        columnId: "col-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createTask({
        title: "New Task",
        columnId: "col-1",
      });

      expect(mockDb.task.findFirst).toHaveBeenCalledWith({
        where: { columnId: "col-1" },
        orderBy: { order: "desc" },
      });
      expect(mockDb.task.create).toHaveBeenCalledWith({
        data: {
          title: "New Task",
          description: undefined,
          columnId: "col-1",
          dueDate: undefined,
          order: 6,
        },
      });
      expect(result.title).toBe("New Task");
    });

    it("should create first task with order 0", async () => {
      mockDb.task.findFirst.mockResolvedValue(null);
      mockDb.task.create.mockResolvedValue({
        id: "new-task",
        title: "First Task",
        description: null,
        order: 0,
        dueDate: null,
        columnId: "col-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createTask({
        title: "First Task",
        columnId: "col-1",
      });

      expect(result.order).toBe(0);
    });

    it("should create task with description and due date", async () => {
      const dueDate = new Date("2024-12-31");
      mockDb.task.findFirst.mockResolvedValue(null);
      mockDb.task.create.mockResolvedValue({
        id: "new-task",
        title: "Task with details",
        description: "Description here",
        order: 0,
        dueDate,
        columnId: "col-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createTask({
        title: "Task with details",
        description: "Description here",
        columnId: "col-1",
        dueDate,
      });

      expect(mockDb.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: "Description here",
          dueDate,
        }),
      });
    });
  });

  describe("updateTask", () => {
    it("should update task title", async () => {
      mockDb.task.update.mockResolvedValue({
        id: "task-1",
        title: "Updated Title",
        description: null,
        order: 0,
        dueDate: null,
        columnId: "col-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await updateTask("task-1", { title: "Updated Title" });

      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { title: "Updated Title" },
      });
      expect(result.title).toBe("Updated Title");
    });

    it("should move task to different column", async () => {
      mockDb.task.update.mockResolvedValue({
        id: "task-1",
        title: "Task",
        description: null,
        order: 0,
        dueDate: null,
        columnId: "col-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await updateTask("task-1", { columnId: "col-2" });

      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { columnId: "col-2" },
      });
      expect(result.columnId).toBe("col-2");
    });
  });

  describe("deleteTask", () => {
    it("should delete task", async () => {
      mockDb.task.delete.mockResolvedValue({ id: "task-1" });

      await deleteTask("task-1");

      expect(mockDb.task.delete).toHaveBeenCalledWith({ where: { id: "task-1" } });
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });

  describe("updateTaskOrders", () => {
    it("should update multiple task orders in transaction", async () => {
      const updates = [
        { id: "task-1", order: 1, columnId: "col-1" },
        { id: "task-2", order: 0, columnId: "col-1" },
      ];
      mockDb.$transaction.mockResolvedValue([{}, {}]);
      mockDb.task.update.mockResolvedValue({});

      await updateTaskOrders(updates);

      expect(mockDb.$transaction).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });
});
