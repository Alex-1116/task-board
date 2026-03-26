import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskDialog from '@/components/TaskDialog';
import { createMockTask, createMockTag } from '@/test/mock-db';
import type { TaskWithTags } from '@/types';

vi.mock('@/lib/actions', () => ({
  updateTask: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockTask: TaskWithTags = {
  ...createMockTask(),
  tags: [createMockTag()],
};

describe('TaskDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render dialog when open', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<TaskDialog task={mockTask} open={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog title', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('should prefill form with task data', () => {
    const taskWithDescription: TaskWithTags = {
      ...mockTask,
      title: 'Existing Task',
      description: 'Existing description',
    };
    render(<TaskDialog task={taskWithDescription} open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
  });

  it('should have title input field', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    const titleInput = screen.getByPlaceholderText('Task title');
    expect(titleInput).toBeInTheDocument();
  });

  it('should have description textarea', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    const descriptionTextarea = screen.getByPlaceholderText('Add a more detailed description...');
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('should have due date input', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    const labels = screen.getAllByText('Due Date');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should have Cancel and Save buttons', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('should disable Save button when title is empty', async () => {
    const user = userEvent.setup();
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);

    const titleInput = screen.getByPlaceholderText('Task title');
    await user.clear(titleInput);

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeDisabled();
  });

  it('should call onOpenChange with false when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should have maxLength on title input', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    const titleInput = screen.getByPlaceholderText('Task title') as HTMLInputElement;
    expect(titleInput.maxLength).toBe(100);
  });

  it('should have maxLength on description textarea', () => {
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);
    const descriptionTextarea = screen.getByPlaceholderText(
      'Add a more detailed description...'
    ) as HTMLTextAreaElement;
    expect(descriptionTextarea.maxLength).toBe(1000);
  });

  it('should update title value on input', async () => {
    const user = userEvent.setup();
    render(<TaskDialog task={mockTask} open={true} onOpenChange={mockOnOpenChange} />);

    const titleInput = screen.getByPlaceholderText('Task title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Task Title');

    expect(screen.getByDisplayValue('New Task Title')).toBeInTheDocument();
  });
});
