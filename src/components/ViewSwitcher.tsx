'use client'

import { Button } from '@/components/ui/button'
import { LayoutGrid, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ViewSwitcherProps {
  boardId: string
  currentView: string
}

export default function ViewSwitcher({ boardId, currentView }: ViewSwitcherProps) {
  const router = useRouter()

  const switchView = (view: string) => {
    router.push(`/?boardId=${boardId}&view=${view}`)
  }

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={currentView === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        className="gap-2"
        onClick={() => switchView('kanban')}
      >
        <LayoutGrid className="w-4 h-4" />
        Board View
      </Button>
      <Button
        variant={currentView === 'gantt' ? 'default' : 'ghost'}
        size="sm"
        className="gap-2"
        onClick={() => switchView('gantt')}
      >
        <BarChart3 className="w-4 h-4" />
        Gantt View
      </Button>
    </div>
  )
}
