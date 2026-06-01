import { type CSSProperties, useMemo, useRef } from 'react'
import type { Room, Task } from '../domain/types'
import { roomStats } from '../services/roomService'
import { Modal } from './Modal'

interface RoomModalProps {
  room: Room | null
  roomTasks: Task[]
  roomImage: string | null
  onClose: () => void
  onOpenTask: (taskId: string) => void
  onToggleTaskDone: (taskId: string) => void
  onCreateTask: (roomId: string) => void
  onRoomColorChange: (room: Room, color: string) => void
}

const priorityRank = { high: 3, normal: 2, low: 1 }

const statusLabel = (s: string) =>
  s === 'done' ? 'Terminé' : s === 'in_progress' ? 'En cours' : 'À faire'

export const RoomModal = ({
  room,
  roomTasks,
  roomImage,
  onClose,
  onOpenTask,
  onToggleTaskDone,
  onCreateTask,
  onRoomColorChange,
}: RoomModalProps) => {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const open = Boolean(room)
  const stats = room ? roomStats(room.id, roomTasks) : { openCount: 0, progress: 0 }

  const sortedTasks = useMemo(() => {
    const items = [...roomTasks]
    items.sort((a, b) => {
      const doneDelta = Number(a.status === 'done') - Number(b.status === 'done')
      if (doneDelta !== 0) return doneDelta
      const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority]
      if (priorityDelta !== 0) return priorityDelta
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return items
  }, [roomTasks])

  return (
    <Modal
      open={open}
      title={room ? room.name : ''}
      onClose={onClose}
      className="modal--room"
      style={{
        '--room-color': room?.color ?? '#f59e0b',
      } as CSSProperties}
      closeIconOnly
      headerActions={
        room ? (
          <div className="room-tools room-tools--header">
            <button
              className="btn btn--ghost btn--icon"
              type="button"
              onClick={() => colorInputRef.current?.click()}
              title="Modifier la couleur"
              aria-label="Modifier la couleur"
            >
              <span className="rm-color-swatch" style={{ background: room.color }} />
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={room.color}
              onChange={(e) => onRoomColorChange(room, e.target.value)}
              style={{ display: 'none' }}
            />
            <button
              className="rm-add-btn"
              type="button"
              onClick={() => onCreateTask(room.id)}
              aria-label="Ajouter une tâche"
            >
              +
            </button>
          </div>
        ) : null
      }
    >
      {room ? (
        <>
          {/* Barre de progression */}
          <div className="rm-stats">
            <div className="rm-stats__row">
              <span className="rm-stats__count">
                <strong style={{ color: room.color }}>{stats.openCount}</strong>
                {' '}tâche{stats.openCount !== 1 ? 's' : ''} en cours
              </span>
              <span className="rm-stats__pct">{stats.progress}%</span>
            </div>
            <div className="rm-stats__track">
              <div
                className="rm-stats__fill"
                style={{ width: `${stats.progress}%`, background: room.color }}
              />
            </div>
          </div>

          {/* Liste des tâches */}
          {sortedTasks.length > 0 ? (
            <ul className="rm-task-list">
              {sortedTasks.map((task) => (
                <li
                  key={task.id}
                  className={`rm-task rm-task--${task.priority} rm-task--${task.status}`}
                  onClick={() => onOpenTask(task.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onOpenTask(task.id)
                  }}
                >
                  <div className="rm-task__body">
                    <h4 className="rm-task__title">{task.title}</h4>
                    <div className="rm-task__meta">
                      <span className={`rm-task__chip rm-task__chip--${task.status}`}>
                        {statusLabel(task.status)}
                      </span>
                      {task.assignee && (
                        <span className={`rm-task__who rm-task__who--${task.assignee}`}>
                          {task.assignee === 'wife' ? 'C' : 'B'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="rm-task__check"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTaskDone(task.id)
                    }}
                    aria-label={task.status === 'done' ? 'Marquer à faire' : 'Marquer terminée'}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rm-empty">Aucune tâche dans cette pièce.</p>
          )}
        </>
      ) : null}
    </Modal>
  )
}
