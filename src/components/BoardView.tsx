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
import GanttView from './GanttView'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, GanttChart } from 'lucide-react'
import { createColumn, updateColumnOrders, updateTaskOrders } from '@/lib/actions'
import { toast } from 'sonner'

type ViewMode = 'kanban' | 'gantt'

interface BoardViewProps {
  board: BoardWithColumns
}

export default function BoardView({ board }: BoardViewProps) {
  const [columns, setColumns] = useState<ColumnWithTasks[]>(board.columns)
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null)
  const [activeTask, setActiveTask] = useState<TaskWithTags | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

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
    } catch {
      toast.error('Failed to add column')
    }
  }

  // 甘特图视图
  if (viewMode === 'gantt') {
    return (
      <div className="h-full flex flex-col">
        {/* 视图切换按钮 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              看板视图
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setViewMode('gantt')}
            >
              <GanttChart className="w-4 h-4 mr-2" />
              甘特图视图
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <GanttView board={board} />
        </div>
      </div>
    )
  }

  // 看板视图
  return (
    <div className="h-full flex flex-col">
      {/* 视图切换按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            看板视图
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('gantt')}
          >
            <GanttChart className="w-4 h-4 mr-2" />
            甘特图视图
          </Button>
        </div>
      </div>
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
    </div>
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
