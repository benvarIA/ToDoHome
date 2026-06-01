import type { ColorMode, Room, Task } from '../domain/types'
import { uiAssets } from '../domain/uiAssets'

interface TaskChipProps {
  task: Task
  room: Room | undefined
  colorMode: ColorMode
  onClick: () => void
}

const priorityColor: Record<Task['priority'], string> = {
  low: '#7dd3fc',
  normal: '#fbbf24',
  high: '#fb7185',
}

const assigneeColor: Record<'me' | 'wife' | 'none', string> = {
  me: '#22c55e',
  wife: '#f97316',
  none: '#94a3b8',
}

const colorFor = (task: Task, room: Room | undefined, mode: ColorMode) => {
  if (mode === 'room') return room?.color ?? '#8b5cf6'
  if (mode === 'assignee') return assigneeColor[task.assignee ?? 'none']
  return priorityColor[task.priority]
}

const statusLabel: Record<Task['status'], string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Fait',
}

export const TaskChip = ({ task, room, colorMode, onClick }: TaskChipProps) => {
  const tone = colorFor(task, room, colorMode)
  const priorityImage =
    task.priority === 'high'
      ? uiAssets.priority.high
      : task.priority === 'normal'
        ? uiAssets.priority.normal
        : uiAssets.priority.low
  const statusImage =
    task.status === 'done'
      ? uiAssets.status.done
      : task.status === 'in_progress'
        ? uiAssets.status.inProgress
        : uiAssets.status.todo
  return (
    <button
      type="button"
      className={`task-chip ${task.status === 'done' ? 'task-chip--done' : ''}`.trim()}
      onClick={onClick}
      style={{ borderLeft: `6px solid ${tone}` }}
      title={task.description || task.title}
    >
      <span className="task-chip__title">{task.title}</span>
      <span className="task-chip__meta">
        <img className="priority-mini" src={priorityImage} alt={`Priorité ${task.priority}`} />
        <img className="status-mini" src={statusImage} alt={`Statut ${statusLabel[task.status]}`} />
        {statusLabel[task.status]} · {task.assignee === null ? 'Personne' : task.assignee === 'wife' ? 'Camille' : 'Benoit'}
      </span>
    </button>
  )
}
