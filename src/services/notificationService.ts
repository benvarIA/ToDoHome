import type { Assignee } from '../domain/types'

export const notifyAssignment = async (taskTitle: string, assignee: Assignee): Promise<void> => {
  if (!assignee) return
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle, assignee }),
    })
  } catch {
    // Notification failure is non-blocking
  }
}
