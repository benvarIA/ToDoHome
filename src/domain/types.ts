export type AppTab = 'home' | 'house' | 'todo' | 'ai'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'normal' | 'high'
export type Assignee = 'me' | 'wife' | null
export type ColorMode = 'room' | 'assignee' | 'priority'
export type SortOption = 'priority' | 'due' | 'recent' | 'alpha'

export interface SubTask {
  id: string
  label: string
  done: boolean
}

export interface Room {
  id: string
  name: string
  color: string
  image: string
  order: number
}

export interface Task {
  id: string
  title: string
  description: string
  roomId: string | null
  status: TaskStatus
  priority: Priority
  assignee: Assignee
  dueDate: string | null
  color: string
  subtasks: SubTask[]
  recurringPlanId?: string
  recurringDueDate?: string
  createdAt: string
  updatedAt: string
}

export interface RecurringPlan {
  id: string
  title: string
  roomId: string | null
  frequencyDays: number
  nextDueDate: string
  active: boolean
  createdAt: string
}

export interface Filters {
  search: string
  status: TaskStatus | 'all'
  priority: Priority | 'all'
  assignee: Assignee | 'all'
  due: 'all' | 'today' | 'week' | 'overdue'
}

export interface Calendar {
  id: string
  name: string
  owner: Exclude<Assignee, null>
}

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  description: string
  start: string
  end: string
}

export interface CalendarEventDraft {
  calendarId: string
  title: string
  description: string
  start: string
  end: string
}

export interface PersistedStateV1 {
  version: 1
  colorMode: ColorMode
  sort: SortOption
  filters: Filters
  rooms: Room[]
  tasks: Task[]
  recurringPlans: RecurringPlan[]
}
