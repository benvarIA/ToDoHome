import { mockCalendars } from '../domain/defaultData'
import type { CalendarEvent, CalendarEventDraft, Task } from '../domain/types'
import { createId } from './id'

const events: CalendarEvent[] = []

const durationByPriority = {
  high: 60,
  normal: 30,
  low: 20,
}

const plusMinutesIso = (startIso: string, minutes: number) => {
  const date = new Date(startIso)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString().slice(0, 16)
}

export const listCalendars = () => mockCalendars

export const listEvents = () => [...events].sort((a, b) => a.start.localeCompare(b.start))

export const createEventFromTaskDraft = (task: Task, roomName: string | null): CalendarEventDraft => {
  const start = task.dueDate ?? new Date().toISOString().slice(0, 16)
  const duration = durationByPriority[task.priority]
  const calendarId = task.assignee === 'wife' ? 'cal-wife' : 'cal-me'

  return {
    calendarId,
    title: roomName ? `[${roomName}] ${task.title}` : task.title,
    description: task.description || 'Créé depuis ToDoHome',
    start,
    end: plusMinutesIso(start, duration),
  }
}

export const createEventFromTask = (draft: CalendarEventDraft) => {
  const event: CalendarEvent = {
    id: createId('event'),
    calendarId: draft.calendarId,
    title: draft.title,
    description: draft.description,
    start: draft.start,
    end: draft.end,
  }
  events.push(event)
  return event
}
