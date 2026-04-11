'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BoardWithColumns, TaskWithTags } from '@/types'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Columns } from 'lucide-react'
import TaskDialog from './TaskDialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface GanttViewProps {
  board: BoardWithColumns
}

export default function GanttView({ board }: GanttViewProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const allTasks = useMemo(() => {
    return board.columns.flatMap((col) =>
      col.tasks.map((task) => ({ ...task, columnName: col.name }))
    )
  }, [board])

  const dateRange = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tasksWithDueDate = allTasks.filter((t) => t.dueDate)
    if (tasksWithDueDate.length === 0) {
      const dates = []
      for (let i = -3; i <= 10; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
      return dates
    }

    const dueDates = tasksWithDueDate.map((t) => new Date(t.dueDate!))
    const minDate = new Date(Math.min(...dueDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dueDates.map((d) => d.getTime())))

    minDate.setDate(minDate.getDate() - 3)
    maxDate.setDate(maxDate.getDate() + 7)

    const dates: Date[] = []
    const current = new Date(minDate)
    while (current <= maxDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }, [allTasks])

  const getTaskPosition = (task: TaskWithTags) => {
    if (!task.dueDate) return null
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    const dateIndex = dateRange.findIndex((d) => d.getTime() === dueDate.getTime())
    if (dateIndex === -1) return null

    return {
      left: dateIndex * 120 + 8,
      width: 120 - 16,
    }
  }

  const getTaskColor = (task: TaskWithTags) => {
    if (task.tags.length > 0) {
      return task.tags[0].color
    }
    return '#6b7280'
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleTaskClick = (task: TaskWithTags) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b bg-muted/30">
        <div className="w-64 min-w-64 p-3 border-r font-medium text-sm shrink-0 flex items-center gap-2">
          <Columns className="w-4 h-4" />
          Tasks by Column
        </div>
        <ScrollArea className="flex-1">
          <div className="flex" style={{ width: dateRange.length * 120 }}>
            {dateRange.map((date, idx) => (
              <div
                key={idx}
                className={`w-[120px] min-w-[120px] p-3 text-center text-sm font-medium border-r ${
                  isToday(date) ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`text-lg ${isToday(date) ? 'font-bold' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex">
          <div className="w-64 min-w-64 shrink-0">
            {board.columns.map((column) => (
              <div key={column.id} className="border-b">
                <div className="p-3 border-r bg-muted/20 font-semibold text-sm sticky left-0">
                  {column.name}
                  <span className="text-muted-foreground ml-2">({column.tasks.length})</span>
                </div>
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border-r border-b last:border-b-0 text-sm truncate"
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    {task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                            style={{
                              backgroundColor: tag.color + '20',
                              borderColor: tag.color,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ width: dateRange.length * 120 }}>
            {board.columns.map((column) => (
              <div key={column.id} className="border-b">
                <div className="p-3 h-10 bg-muted/5 border-r"></div>
                {column.tasks.map((task) => {
                  const position = getTaskPosition(task)
                  const color = getTaskColor(task)

                  return (
                    <div key={task.id} className="h-[60px] border-b last:border-b-0 relative">
                      {position && (
                        <Popover>
                          <PopoverTrigger>
                            <div
                              className="absolute top-2 h-9 px-2 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex items-center overflow-hidden rounded-md border"
                              style={{
                                left: position.left,
                                width: position.width,
                                backgroundColor: color + '30',
                                borderColor: color,
                                borderLeftWidth: '4px',
                              }}
                              onClick={() => handleTaskClick(task)}
                            >
                              <span className="text-xs font-medium truncate">
                                {task.title}
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4" side="right">
                            <div className="space-y-3">
                              <h4 className="font-semibold">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="w-4 h-4" />
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString()
                                  : 'No due date'}
                              </div>
                              {task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: tag.color + '20',
                                        borderColor: tag.color,
                                      }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground pt-2 border-t">
                                Click to edit task
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  )
}
