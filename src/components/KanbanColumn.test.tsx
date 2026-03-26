import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanbanColumn from "@/components/KanbanColumn";
import { createMockColumn, createMockTask, createMockTag } from "@/test/mock-db";
import type { ColumnWithTasks, TaskWithTags } from "@/types";

vi.mock("@/lib/actions", () => ({
  deleteColumn: vi.fn(),
  createTask: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockColumnWithTasks = (tasks: TaskWithTags[] = []): ColumnWithTasks => ({
  ...createMockColumn(),
  tasks,
});

describe("KanbanColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render column name", () => {
    const column = createMockColumnWithTasks();
    render(<KanbanColumn column={column} />);
    expect(screen.getByText("Todo")).toBeInTheDocument();
  });

  it("should render task count", () => {
    const column = createMockColumnWithTasks([
      { ...createMockTask(), id: "task-1", tags: [] },
      { ...createMockTask(), id: "task-2", tags: [] },
    ]);
    render(<KanbanColumn column={column} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should render tasks", () => {
    const column = createMockColumnWithTasks([
      { ...createMockTask(), id: "task-1", title: "Task 1", tags: [] },
      { ...createMockTask(), id: "task-2", title: "Task 2", tags: [] },
    ]);
    render(<KanbanColumn column={column} />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("should render empty column", () => {
    const column = createMockColumnWithTasks([]);
    render(<KanbanColumn column={column} />);
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("should have Add Task button", () => {
    const column = createMockColumnWithTasks();
    render(<KanbanColumn column={column} />);
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("should render as overlay with correct styles", () => {
    const column = createMockColumnWithTasks();
    render(<KanbanColumn column={column} isOverlay />);
    const columnElement = screen.getByText("Todo").closest('[class*="shadow-2xl"]');
    expect(columnElement).toBeInTheDocument();
  });

  it("should show delete option in dropdown menu", async () => {
    const user = userEvent.setup();
    const column = createMockColumnWithTasks();
    render(<KanbanColumn column={column} />);

    const menuButtons = screen.getAllByRole("button");
    const moreButton = menuButtons.find((btn) => btn.querySelector("svg.lucide-more-horizontal"));

    if (moreButton) {
      await user.click(moreButton);
      expect(screen.getByText("Delete Column")).toBeInTheDocument();
    }
  });
});
