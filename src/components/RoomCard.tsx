import { type CSSProperties } from 'react'
import type { ColorMode, Room, Task } from '../domain/types'
import { uiAssets } from '../domain/uiAssets'
import { roomStats } from '../services/roomService'
import { TaskChip } from './TaskChip'

interface RoomCardProps {
  room: Room
  tasks: Task[]
  totalOpenHouseTasks: number
  isLeader?: boolean
  colorMode: ColorMode
  image: string
  showManageActions?: boolean
  openOnCardClick?: boolean
  showTaskList?: boolean
  onOpenRoom: () => void
  onOpenTask: (taskId: string) => void
  onDragStart: () => void
  onDrop: () => void
  onRequestDeleteRoom?: () => void
}

export const RoomCard = ({
  room,
  tasks,
  totalOpenHouseTasks,
  isLeader = false,
  colorMode,
  image,
  showManageActions = false,
  openOnCardClick = false,
  showTaskList = true,
  onOpenRoom,
  onOpenTask,
  onDragStart,
  onDrop,
  onRequestDeleteRoom,
}: RoomCardProps) => {
  const stats = roomStats(room.id, tasks)
  const openTasks = tasks.filter((task) => task.status !== 'done')
  const sharePercent = totalOpenHouseTasks > 0 ? Math.round((openTasks.length / totalOpenHouseTasks) * 100) : 0
  const percentColor = `hsl(${Math.max(0, 120 - Math.round((sharePercent * 120) / 100))} 78% 40%)`
  const priorityIconForTask = (task: Task) =>
    task.priority === 'high' ? uiAssets.priority.high : task.priority === 'normal' ? uiAssets.priority.normal : uiAssets.priority.low
  const cardTone =
    colorMode === 'room'
      ? room.color
      : colorMode === 'assignee'
        ? tasks.some((task) => task.assignee === 'wife')
          ? '#f97316'
          : tasks.some((task) => task.assignee === 'me')
            ? '#22c55e'
            : '#94a3b8'
        : tasks.some((task) => task.priority === 'high')
          ? '#fb7185'
          : tasks.some((task) => task.priority === 'normal')
            ? '#fbbf24'
            : '#7dd3fc'
  return (
    <article
      className={`room-card ${isLeader ? 'room-card--leader' : ''} ${showManageActions ? 'room-card--open-all' : ''} ${showManageActions || openOnCardClick ? 'popup-open-trigger' : ''}`.trim()}
      style={{ borderTop: `8px solid ${cardTone}`, '--room-bg-image': `url(${image})` } as CSSProperties}
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onClick={() => {
        if (showManageActions || openOnCardClick) onOpenRoom()
      }}
      onKeyDown={(event) => {
        if (!showManageActions && !openOnCardClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenRoom()
        }
      }}
      role={showManageActions || openOnCardClick ? 'button' : undefined}
      tabIndex={showManageActions || openOnCardClick ? 0 : undefined}
    >
      {showManageActions ? (
        <div className="room-card__actions">
          <button
            className="room-card__icon room-card__icon--delete"
            type="button"
            title="Supprimer la pièce"
            onClick={(event) => {
              event.stopPropagation()
              onRequestDeleteRoom?.()
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="room-card__head popup-open-trigger"
        onClick={(event) => {
          event.stopPropagation()
          onOpenRoom()
        }}
      >
        <div>
          <h3>{room.name}</h3>
          {showTaskList ? (
            <div className="room-card__prio-icons" aria-label={`${stats.openCount} tâches ouvertes`}>
              {openTasks.map((task) => (
                <img
                  key={task.id}
                  src={priorityIconForTask(task)}
                  alt={`Priorité ${task.priority}`}
                  className="room-card__prio-icon"
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </div>
        <span className="color-dot" style={{ background: room.color }} />
      </button>

      <div className="progress">
        <div className="progress__bar" style={{ width: `${sharePercent}%`, background: percentColor }} />
      </div>
      <small style={{ color: percentColor }}>{sharePercent}%</small>
      {!showTaskList ? (
        <div className="room-card__prio-icons room-card__prio-icons--below" aria-label={`${stats.openCount} tâches ouvertes`}>
          {openTasks.map((task) => (
            <img
              key={task.id}
              src={priorityIconForTask(task)}
              alt={`Priorité ${task.priority}`}
              className="room-card__prio-icon"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      {showTaskList ? (
        <div className="chip-list">
          {tasks.length === 0 ? <p className="empty">Aucune tâche pour l’instant.</p> : null}
          {tasks.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              room={room}
              colorMode={colorMode}
              onClick={() => onOpenTask(task.id)}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}
