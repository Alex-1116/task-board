import { Board, Column, Task, Tag } from '../generated/client'

export type TaskWithTags = Task & { tags: Tag[] }
export type ColumnWithTasks = Column & { tasks: TaskWithTags[] }
export type BoardWithColumns = Board & { columns: ColumnWithTasks[] }
