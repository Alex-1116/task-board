'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskWithTags } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteTask } from '@/lib/actions';
import { toast } from 'sonner';
import { useState } from 'react';
import TaskDialog from './TaskDialog';

interface KanbanTaskProps {
  task: TaskWithTags;
  isOverlay?: boolean;
}

export default function KanbanTask({ task, isOverlay }: KanbanTaskProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-primary border-dashed h-[100px]"
      />
    );
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
    } catch (_error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group ${
          isOverlay ? 'shadow-2xl rotate-3 scale-105 cursor-grabbing' : ''
        }`}
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-3 space-y-2 relative">
          <div className="flex justify-between items-start gap-2">
            <p className="font-medium text-sm leading-tight">{task.title}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                  style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {isDialogOpen && (
        <TaskDialog task={task} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}
    </>
  );
}
