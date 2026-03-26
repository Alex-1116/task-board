'use client';

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteColumn, createTask } from '@/lib/actions';
import { ColumnWithTasks } from '@/types';

import KanbanTask from './KanbanTask';

interface KanbanColumnProps {
  column: ColumnWithTasks;
  isOverlay?: boolean;
}

export default function KanbanColumn({ column, isOverlay }: KanbanColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const tasksIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card/50 border-primary h-[500px] w-[300px] shrink-0 rounded-lg border-2 opacity-40"
      />
    );
  }

  const handleDelete = async () => {
    if (!confirm('Delete this column and all its tasks?')) return;
    try {
      await deleteColumn(column.id);
      toast.success('Column deleted');
    } catch (_error) {
      toast.error('Failed to delete column');
    }
  };

  const handleAddTask = async () => {
    const title = prompt('Task title:');
    if (!title) return;
    try {
      await createTask({ title, columnId: column.id });
      toast.success('Task created');
    } catch (_error) {
      toast.error('Failed to create task');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card flex w-[300px] shrink-0 flex-col rounded-lg border ${
        isOverlay ? 'rotate-2 cursor-grabbing shadow-2xl' : 'shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="bg-muted/50 flex cursor-grab items-center justify-between rounded-t-lg border-b p-3 font-semibold active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <span>{column.name}</span>
          <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
            {column.tasks.length}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-[150px] flex-1 flex-col gap-2 overflow-y-auto p-3">
        <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="text-muted-foreground w-full justify-start"
          onClick={handleAddTask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
