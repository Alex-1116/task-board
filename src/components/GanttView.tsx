'use client'

import { BoardWithColumns, TaskWithTags } from '@/types'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import TaskDialog from './TaskDialog'

interface GanttViewProps {
  board: BoardWithColumns
}

const DAY_WIDTH = 120
const TASK_HEIGHT = 48
const HEADER_HEIGHT = 60

export default function GanttView({ board }: GanttViewProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const allTasks = useMemo(() => {
    return board.columns.flatMap(col => 
      col.tasks.map(task => ({
        ...task,
        columnName: col.name
      }))
    )
  }, [board.columns])

  const tasksWithDueDate = useMemo(() => {
    return allTasks.filter(task => task.dueDate)
  }, [allTasks])

  const dateRange = useMemo(() => {
    if (tasksWithDueDate.length === 0) {
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 21)
      return { startDate, endDate }
    }

    const dates = tasksWithDueDate.map(task => new Date(task.dueDate!))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    minDate.setDate(minDate.getDate() - 7)
    maxDate.setDate(maxDate.getDate() + 7)

    return { startDate: minDate, endDate: maxDate }
  }, [tasksWithDueDate])

  const days = useMemo(() => {
    const days = []
    const current = new Date(dateRange.startDate)
    while (current <= dateRange.endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [dateRange])

  const getTaskPosition = (task: TaskWithTags) => {
    if (!task.dueDate) return null

    const taskDate = new Date(task.dueDate)
    taskDate.setHours(0, 0, 0, 0)

    const startDate = new Date(dateRange.startDate)
    startDate.setHours(0, 0, 0, 0)

    const diffTime = taskDate.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return {
      left: diffDays * DAY_WIDTH,
      width: DAY_WIDTH - 8
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })
  }

  const formatDay = (date: Date) => {
    return date.getDate()
  }

  const formatWeekday = (date: Date) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return weekdays[date.getDay()]
  }

  const getTaskColor = (task: TaskWithTags) => {
    if (task.tags.length > 0) {
      return task.tags[0].color
    }
    return '#3b82f6'
  }

  const handleTaskClick = (task: TaskWithTags) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const groupedByColumn = useMemo(() => {
    const grouped: { [key: string]: (TaskWithTags & { columnName: string })[] } = {}
    board.columns.forEach(col => {
      grouped[col.name] = allTasks.filter(task => task.columnId === col.id)
    })
    return grouped
  }, [board.columns, allTasks])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="inline-flex min-w-full">
          <div className="sticky left-0 z-20 bg-background border-r">
            <div className="border-b" style={{ height: HEADER_HEIGHT }}>
              <div className="px-4 py-2 font-semibold text-sm">任务列表</div>
            </div>
            <div>
              {Object.entries(groupedByColumn).map(([columnName, tasks]) => (
                <div key={columnName}>
                  <div className="px-4 py-2 bg-muted/30 font-medium text-sm border-b">
                    {columnName} ({tasks.length})
                  </div>
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className="px-4 py-2 border-b flex items-center gap-2 hover:bg-muted/50 cursor-pointer"
                      style={{ height: TASK_HEIGHT }}
                      onClick={() => handleTaskClick(task)}
                    >
                      <span className="text-sm truncate flex-1">{task.title}</span>
                      {task.dueDate && (
                        <CalendarDays className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="relative">
              <div className="sticky top-0 z-10 bg-background border-b" style={{ height: HEADER_HEIGHT }}>
                <div className="flex">
                  {days.map((day, idx) => {
                    const showMonth = idx === 0 || day.getDate() === 1
                    return (
                      <div
                        key={idx}
                        className={`flex-shrink-0 border-r text-center ${
                          isToday(day) ? 'bg-primary/5' : isWeekend(day) ? 'bg-muted/30' : ''
                        }`}
                        style={{ width: DAY_WIDTH }}
                      >
                        {showMonth && (
                          <div className="text-xs font-semibold text-muted-foreground border-b py-1">
                            {formatMonth(day)}
                          </div>
                        )}
                        <div className="py-1">
                          <div className="text-sm font-semibold">{formatDay(day)}</div>
                          <div className="text-xs text-muted-foreground">{formatWeekday(day)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="relative">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`absolute top-0 bottom-0 border-r border-dashed ${
                      isToday(day) ? 'bg-primary/5' : isWeekend(day) ? 'bg-muted/10' : ''
                    }`}
                    style={{ left: idx * DAY_WIDTH, width: DAY_WIDTH }}
                  />
                ))}

                {Object.entries(groupedByColumn).map(([columnName, tasks]) => {
                  const columnTasks = tasks.filter(t => t.dueDate)
                  return (
                    <div key={columnName}>
                      <div className="border-b bg-muted/10" style={{ height: 40 }} />
                      {tasks.map(task => {
                        const position = getTaskPosition(task)
                        if (!position) {
                          return (
                            <div
                              key={task.id}
                              className="border-b"
                              style={{ height: TASK_HEIGHT }}
                            />
                          )
                        }

                        const color = getTaskColor(task)
                        return (
                          <div
                            key={task.id}
                            className="border-b relative"
                            style={{ height: TASK_HEIGHT }}
                          >
                            <div
                              className="absolute top-2 h-10 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2 gap-2"
                              style={{
                                left: position.left,
                                width: position.width,
                                backgroundColor: color + '20',
                                borderLeft: `3px solid ${color}`
                              }}
                              onClick={() => handleTaskClick(task)}
                              title={`${task.title}\n截止: ${new Date(task.dueDate!).toLocaleDateString('zh-CN')}`}
                            >
                              <span className="text-xs font-medium truncate">{task.title}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

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
