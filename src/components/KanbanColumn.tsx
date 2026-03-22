'use client'

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnWithTasks } from '@/types'
import KanbanTask from './KanbanTask'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteColumn, createTask } from '@/lib/actions'
import { toast } from 'sonner'

interface KanbanColumnProps {
  column: ColumnWithTasks
  isOverlay?: boolean
}

export default function KanbanColumn({ column, isOverlay }: KanbanColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  const tasksIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks])

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card/50 opacity-40 border-2 border-primary rounded-lg w-[300px] h-[500px] shrink-0"
      />
    )
  }

  const handleDelete = async () => {
    if (!confirm('Delete this column and all its tasks?')) return
    try {
      await deleteColumn(column.id)
      toast.success('Column deleted')
    } catch (error) {
      toast.error('Failed to delete column')
    }
  }

  const handleAddTask = async () => {
    const title = prompt('Task title:')
    if (!title) return
    try {
      await createTask({ title, columnId: column.id })
      toast.success('Task created')
    } catch (error) {
      toast.error('Failed to create task')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg w-[300px] flex flex-col shrink-0 border ${
        isOverlay ? 'shadow-2xl rotate-2 cursor-grabbing' : 'shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-3 font-semibold flex items-center justify-between border-b cursor-grab active:cursor-grabbing bg-muted/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span>{column.name}</span>
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1 min-h-[150px]">
        <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      <div className="p-3 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  )
}
