'use client'

import { useState, useMemo } from 'react'
import { BoardWithColumns, TaskWithTags } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import TaskDialog from './TaskDialog'
import { CalendarDays } from 'lucide-react'

interface GanttViewProps {
  board: BoardWithColumns
}

const DAY_WIDTH = 60 // 每天宽度 60px
const ROW_HEIGHT = 56

export default function GanttView({ board }: GanttViewProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 收集所有有 dueDate 的任务
  const tasksWithDueDate = useMemo(() => {
    const tasks: Array<{ task: TaskWithTags; columnName: string }> = []
    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task.dueDate) {
          tasks.push({ task, columnName: column.name })
        }
      })
    })
    // 按 dueDate 排序
    return tasks.sort((a, b) => {
      const dateA = new Date(a.task.dueDate!).getTime()
      const dateB = new Date(b.task.dueDate!).getTime()
      return dateA - dateB
    })
  }, [board.columns])

  // 计算时间范围
  const { startDate, totalDays } = useMemo(() => {
    if (tasksWithDueDate.length === 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekLater = new Date(today)
      weekLater.setDate(weekLater.getDate() + 7)
      return { startDate: today, endDate: weekLater, totalDays: 7 }
    }

    const dates = tasksWithDueDate.map((t) => new Date(t.task.dueDate!))
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

    // 添加前后各3天的缓冲
    const startDate = new Date(minDate)
    startDate.setDate(startDate.getDate() - 3)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(maxDate)
    endDate.setDate(endDate.getDate() + 3)
    endDate.setHours(0, 0, 0, 0)

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    return { startDate, totalDays }
  }, [tasksWithDueDate])

  // 生成日期数组
  const dateRange = useMemo(() => {
    const dates: Date[] = []
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [startDate, totalDays])

  // 计算任务位置
  const getTaskPosition = (dueDate: Date) => {
    const daysDiff = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff * DAY_WIDTH
  }

  // 获取任务的主要标签颜色
  const getTaskColor = (task: TaskWithTags) => {
    if (task.tags.length > 0) {
      return task.tags[0].color
    }
    return '#3b82f6' // 默认蓝色
  }

  // 获取任务的主要标签名称
  const getTaskTagName = (task: TaskWithTags) => {
    if (task.tags.length > 0) {
      return task.tags[0].name
    }
    return ''
  }

  const handleTaskClick = (task: TaskWithTags) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  // 按列分组任务
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Array<{ task: TaskWithTags; columnName: string }>> = {}
    board.columns.forEach((column) => {
      grouped[column.name] = tasksWithDueDate.filter((t) => t.columnName === column.name)
    })
    return grouped
  }, [board.columns, tasksWithDueDate])

  if (tasksWithDueDate.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无任务</h3>
          <p className="text-muted-foreground">没有设置截止日期的任务</p>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="min-w-max">
            {/* 时间轴头部 */}
            <div className="sticky top-0 z-10 bg-background border-b">
              <div className="flex">
                {/* 左侧列名区域 */}
                <div className="w-40 shrink-0 bg-muted/50 border-r p-3 font-medium text-sm flex items-center">
                  列 / 任务
                </div>
                {/* 日期区域 */}
                <div className="flex">
                  {dateRange.map((date, index) => {
                    const isToday = new Date().toDateString() === date.toDateString()
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    return (
                      <div
                        key={index}
                        className={`shrink-0 border-r text-center py-2 text-xs ${
                          isToday
                            ? 'bg-primary/10 font-semibold'
                            : isWeekend
                            ? 'bg-muted/30'
                            : ''
                        }`}
                        style={{ width: DAY_WIDTH }}
                      >
                        <div className={isToday ? 'text-primary' : ''}>
                          {date.getDate()}
                        </div>
                        <div className="text-muted-foreground">
                          {['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 甘特图主体 */}
            <div>
              {Object.entries(tasksByColumn).map(([columnName, columnTasks]) => {
                if (columnTasks.length === 0) return null

                return (
                  <div key={columnName} className="border-b">
                    {/* 列标题行 */}
                    <div className="flex bg-muted/20">
                      <div className="w-40 shrink-0 p-3 font-medium text-sm border-r flex items-center">
                        {columnName}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {columnTasks.length}
                        </Badge>
                      </div>
                      <div className="flex-1"></div>
                    </div>

                    {/* 该列下的任务 */}
                    {columnTasks.map(({ task }) => {
                      const dueDate = new Date(task.dueDate!)
                      const position = getTaskPosition(dueDate)
                      const taskColor = getTaskColor(task)
                      const tagName = getTaskTagName(task)

                      return (
                        <div
                          key={task.id}
                          className="flex hover:bg-muted/10"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {/* 任务名称区域 */}
                          <div className="w-40 shrink-0 p-2 border-r flex items-center overflow-hidden">
                            <span className="text-sm truncate" title={task.title}>
                              {task.title}
                            </span>
                          </div>

                          {/* 时间轴区域 */}
                          <div className="relative flex-1">
                            {/* 网格线 */}
                            <div className="absolute inset-0 flex">
                              {dateRange.map((_, index) => (
                                <div
                                  key={index}
                                  className="shrink-0 border-r border-dashed border-muted"
                                  style={{ width: DAY_WIDTH }}
                                />
                              ))}
                            </div>

                            {/* 任务条形图 */}
                            <Tooltip>
                              <TooltipTrigger
                                className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md cursor-pointer shadow-sm hover:shadow-md transition-shadow flex items-center px-2 overflow-hidden text-left"
                                style={{
                                  left: position + 4,
                                  width: DAY_WIDTH - 8,
                                  backgroundColor: taskColor + '30',
                                  borderLeft: `4px solid ${taskColor}`,
                                }}
                                onClick={() => handleTaskClick(task)}
                              >
                                <span className="text-xs font-medium truncate">
                                  {task.title}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{task.title}</p>
                                  {tagName && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: taskColor + '20',
                                        borderColor: taskColor,
                                      }}
                                    >
                                      {tagName}
                                    </Badge>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    截止日期: {dueDate.toLocaleDateString('zh-CN')}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </TooltipProvider>
  )
}
