'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { BoardWithColumns, ColumnWithTasks, TaskWithTags } from '@/types'
import KanbanColumn from './KanbanColumn'
import KanbanTask from './KanbanTask'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createColumn, updateColumnOrders, updateTaskOrders } from '@/lib/actions'
import { toast } from 'sonner'

interface BoardViewProps {
  board: BoardWithColumns
}

export default function BoardView({ board }: BoardViewProps) {
  const [columns, setColumns] = useState<ColumnWithTasks[]>(board.columns)
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null)
  const [activeTask, setActiveTask] = useState<TaskWithTags | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setColumns(board.columns)
  }, [board])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columnsId = columns.map((col) => col.id)

  const handleAddColumn = async () => {
    const name = prompt('Column name:')
    if (!name) return
    try {
      await createColumn(board.id, name)
      toast.success('Column added')
    } catch (error) {
      toast.error('Failed to add column')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 h-full items-start overflow-x-auto pb-4">
        <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
          {columns.map((col) => (
            <KanbanColumn key={col.id} column={col} />
          ))}
        </SortableContext>

        <Button
          variant="outline"
          className="h-[60px] w-[300px] shrink-0 border-dashed bg-muted/50"
          onClick={handleAddColumn}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </div>

      {isClient && createPortal(
        <DragOverlay>
          {activeColumn && <KanbanColumn column={activeColumn} isOverlay />}
          {activeTask && <KanbanTask task={activeTask} isOverlay />}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )

  function onDragStart(event: DragStartEvent) {
    const { active } = event
    const { data } = active

    if (data.current?.type === 'Column') {
      setActiveColumn(data.current.column)
      return
    }

    if (data.current?.type === 'Task') {
      setActiveTask(data.current.task)
      return
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Task'
    const isOverTask = over.data.current?.type === 'Task'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveTask) return

    // Task over Task
    if (isActiveTask && isOverTask) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((c) =>
          c.tasks.some((t) => t.id === activeId)
        )
        const overIndex = columns.findIndex((c) =>
          c.tasks.some((t) => t.id === overId)
        )

        if (activeIndex === -1 || overIndex === -1) return columns

        const activeCol = columns[activeIndex]
        const overCol = columns[overIndex]

        const activeTaskIndex = activeCol.tasks.findIndex((t) => t.id === activeId)
        const overTaskIndex = overCol.tasks.findIndex((t) => t.id === overId)

        if (activeIndex !== overIndex) {
          // Cross column
          const newColumns = [...columns]
          const [movedTask] = newColumns[activeIndex].tasks.splice(activeTaskIndex, 1)
          movedTask.columnId = overCol.id
          newColumns[overIndex].tasks.splice(overTaskIndex, 0, movedTask)
          return newColumns
        } else {
          // Same column
          const newColumns = [...columns]
          newColumns[activeIndex].tasks = arrayMove(
            activeCol.tasks,
            activeTaskIndex,
            overTaskIndex
          )
          return newColumns
        }
      })
    }

    // Task over Column (Empty or dropping on column body)
    if (isActiveTask && isOverColumn) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((c) =>
          c.tasks.some((t) => t.id === activeId)
        )
        const overIndex = columns.findIndex((c) => c.id === overId)

        if (activeIndex === -1 || overIndex === -1) return columns
        if (activeIndex === overIndex) return columns

        const newColumns = [...columns]
        const [movedTask] = newColumns[activeIndex].tasks.splice(
          newColumns[activeIndex].tasks.findIndex((t) => t.id === activeId),
          1
        )
        movedTask.columnId = newColumns[overIndex].id
        newColumns[overIndex].tasks.push(movedTask)
        return newColumns
      })
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null)
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === 'Column'
    
    if (isActiveColumn) {
      setColumns((columns) => {
        const activeColIndex = columns.findIndex((col) => col.id === activeId)
        const overColIndex = columns.findIndex((col) => col.id === overId)
        
        const newColumns = arrayMove(columns, activeColIndex, overColIndex)
        
        // Save to DB
        const updates = newColumns.map((col, idx) => ({ id: col.id, order: idx }))
        updateColumnOrders(updates).catch(() => toast.error('Failed to update column order'))
        
        return newColumns
      })
      return
    }

    // Handle Task Drag End to sync final order to DB
    const isActiveTask = active.data.current?.type === 'Task'
    if (isActiveTask) {
      // Find where it landed based on current state
      const targetCol = columns.find(c => c.tasks.some(t => t.id === activeId))
      if (!targetCol) return

      // Update orders for tasks in the affected columns
      const updates = targetCol.tasks.map((t, idx) => ({
        id: t.id,
        order: idx,
        columnId: targetCol.id
      }))
      
      updateTaskOrders(updates).catch(() => toast.error('Failed to update task order'))
    }
  }
}
