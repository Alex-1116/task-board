"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskWithTags } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTask } from "@/lib/actions";
import { toast } from "sonner";
import { useState } from "react";
import TaskDialog from "./TaskDialog";

interface KanbanTaskProps {
  task: TaskWithTags;
  isOverlay?: boolean;
}

export default function KanbanTask({ task, isOverlay }: KanbanTaskProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "Task",
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
        className="border-primary h-[100px] border-2 border-dashed opacity-30"
      />
    );
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
    } catch (_error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`hover:border-primary/50 group cursor-grab transition-colors active:cursor-grabbing ${
          isOverlay ? "scale-105 rotate-3 cursor-grabbing shadow-2xl" : ""
        }`}
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="relative space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-tight font-medium">{task.title}</p>
            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-6 w-6"
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
                  className="px-1.5 py-0 text-[10px]"
                  style={{ backgroundColor: tag.color + "20", borderColor: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {task.dueDate && (
            <div className="text-muted-foreground flex items-center text-xs">
              <CalendarDays className="mr-1 h-3 w-3" />
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
