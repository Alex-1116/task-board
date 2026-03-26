import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanbanTask from "@/components/KanbanTask";
import { createMockTask, createMockTag } from "@/test/mock-db";
import type { TaskWithTags } from "@/types";

vi.mock("@/lib/actions", () => ({
  deleteTask: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockTask: TaskWithTags = {
  ...createMockTask(),
  tags: [createMockTag()],
};

describe("KanbanTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render task title", () => {
    render(<KanbanTask task={mockTask} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("should render task with tags", () => {
    const taskWithTags: TaskWithTags = {
      ...createMockTask(),
      tags: [
        { ...createMockTag(), id: "tag-1", name: "Feature" },
        { ...createMockTag(), id: "tag-2", name: "Bug" },
      ],
    };
    render(<KanbanTask task={taskWithTags} />);
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("should render task with due date", () => {
    const taskWithDueDate: TaskWithTags = {
      ...createMockTask(),
      dueDate: new Date("2024-12-31"),
      tags: [],
    };
    render(<KanbanTask task={taskWithDueDate} />);
    expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument();
  });

  it("should not render date when no due date", () => {
    const taskNoDueDate: TaskWithTags = {
      ...createMockTask(),
      dueDate: null,
      tags: [],
    };
    render(<KanbanTask task={taskNoDueDate} />);
    expect(screen.queryByTestId("due-date")).not.toBeInTheDocument();
  });

  it("should have cursor-grab class", () => {
    render(<KanbanTask task={mockTask} />);
    const card = screen.getByText("Test Task").closest('[class*="cursor-grab"]');
    expect(card).toBeInTheDocument();
  });

  it("should show delete button on hover", () => {
    render(<KanbanTask task={mockTask} />);
    const card = screen.getByText("Test Task").closest(".group");
    expect(card).toHaveClass("group");
  });

  it("should open TaskDialog when clicked", async () => {
    const user = userEvent.setup();
    render(<KanbanTask task={mockTask} />);

    await user.click(screen.getByText("Test Task"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should render as overlay with correct styles", () => {
    render(<KanbanTask task={mockTask} isOverlay />);
    const card = screen.getByText("Test Task").closest('[class*="shadow-2xl"]');
    expect(card).toBeInTheDocument();
  });

  it("should show opacity when dragging", () => {
    const { container } = render(<KanbanTask task={mockTask} />);
    const card = container.querySelector('[class*="opacity-30"]');
    expect(card).toBeNull();
  });
});
