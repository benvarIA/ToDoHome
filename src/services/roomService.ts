import type { Room, Task } from '../domain/types'
import { taskCompletion } from './taskService'

export const reorderRooms = (rooms: Room[], draggedRoomId: string, targetRoomId: string) => {
  if (draggedRoomId === targetRoomId) return rooms
  const ordered = [...rooms].sort((a, b) => a.order - b.order)
  const draggedIndex = ordered.findIndex((room) => room.id === draggedRoomId)
  const targetIndex = ordered.findIndex((room) => room.id === targetRoomId)
  if (draggedIndex === -1 || targetIndex === -1) return rooms

  const [dragged] = ordered.splice(draggedIndex, 1)
  ordered.splice(targetIndex, 0, dragged)
  return ordered.map((room, index) => ({ ...room, order: index }))
}

export const roomStats = (roomId: string | null, tasks: Task[]) => {
  const roomTasks = tasks.filter((task) => task.roomId === roomId)
  const openCount = roomTasks.filter((task) => task.status !== 'done').length
  return {
    total: roomTasks.length,
    openCount,
    progress: taskCompletion(roomTasks),
  }
}
