import type { Filters, SortOption, Task } from '../domain/types'

const priorityWeight = {
  high: 3,
  normal: 2,
  low: 1,
}

const isInWeek = (date: Date, now: Date) => {
  const end = new Date(now)
  end.setDate(now.getDate() + 7)
  return date >= now && date <= end
}

const matchesDue = (task: Task, due: Filters['due']) => {
  if (due === 'all') return true
  if (!task.dueDate) return false
  const now = new Date()
  const taskDate = new Date(task.dueDate)
  if (due === 'today') return taskDate.toDateString() === now.toDateString()
  if (due === 'week') return isInWeek(taskDate, now)
  if (due === 'overdue') return taskDate < now && task.status !== 'done'
  return true
}

export const filterTasks = (tasks: Task[], filters: Filters) => {
  const q = filters.search.trim().toLowerCase()
  return tasks.filter((task) => {
    const matchesSearch =
      q.length === 0 ||
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q)
    const matchesStatus = filters.status === 'all' || task.status === filters.status
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority
    const matchesAssignee = filters.assignee === 'all' || task.assignee === filters.assignee
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesDue(task, filters.due)
  })
}

export const sortTasks = (tasks: Task[], sort: SortOption) => {
  const sorted = [...tasks]
  sorted.sort((a, b) => {
    if (sort === 'alpha') return a.title.localeCompare(b.title)
    if (sort === 'priority') return priorityWeight[b.priority] - priorityWeight[a.priority]
    if (sort === 'due') {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
  return sorted
}

export const taskCompletion = (tasks: Task[]) => {
  if (tasks.length === 0) return 0
  const doneCount = tasks.filter((task) => task.status === 'done').length
  return Math.round((doneCount / tasks.length) * 100)
}
