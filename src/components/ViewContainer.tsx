'use client'

import { useState } from 'react'
import { BoardWithColumns } from '@/types'
import BoardView from './BoardView'
import GanttView from './GanttView'
import { Button } from '@/components/ui/button'
import { LayoutGrid, GanttChart } from 'lucide-react'

interface ViewContainerProps {
  board: BoardWithColumns
}

export type ViewMode = 'kanban' | 'gantt'

export default function ViewContainer({ board }: ViewContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('kanban')}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          看板视图
        </Button>
        <Button
          variant={viewMode === 'gantt' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('gantt')}
          className="gap-2"
        >
          <GanttChart className="h-4 w-4" />
          甘特图视图
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <BoardView board={board} />
        ) : (
          <GanttView board={board} />
        )}
      </div>
    </div>
  )
}
