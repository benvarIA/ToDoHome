import { type CSSProperties, useMemo } from 'react'
import type { Assignee, Task } from '../domain/types'
import { uiAssets } from '../domain/uiAssets'
import { Modal } from './Modal'

interface AssigneeModalProps {
  assignee: Exclude<Assignee, null> | null
  tasks: Task[]
  onClose: () => void
  onToggleTaskDone: (taskId: string) => void
  onCreateTask: (assignee: Exclude<Assignee, null>) => void
}

const priorityRank = { high: 3, normal: 2, low: 1 }

export const AssigneeModal = ({ assignee, tasks, onClose, onToggleTaskDone, onCreateTask }: AssigneeModalProps) => {
  const open = assignee !== null
  const sortedTasks = useMemo(() => {
    const items = [...tasks]
    items.sort((a, b) => {
      const doneDelta = Number(a.status === 'done') - Number(b.status === 'done')
      if (doneDelta !== 0) return doneDelta
      const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority]
      if (priorityDelta !== 0) return priorityDelta
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return items
  }, [tasks])

  const label = assignee === 'wife' ? 'Camille' : 'Benoit'
  const color = assignee === 'wife' ? '#f97316' : '#22c55e'

  return (
    <Modal
      open={open}
      title={`Todo ${label}`}
      onClose={onClose}
      className="modal modal--room"
      style={{ '--room-watermark': 'none', '--room-color': color } as CSSProperties}
      closeIconOnly
      headerActions={
        assignee ? (
          <button className="btn btn--circle" type="button" onClick={() => onCreateTask(assignee)} title="Ajouter une tâche">
            +
          </button>
        ) : null
      }
    >
      <div className="modal-room-head">
        <div className="room-meta">
          <div>
            <p>{tasks.filter((task) => task.status !== 'done').length} tâches ouvertes</p>
          </div>
        </div>
      </div>
      <div className="task-square-grid">
        {sortedTasks.map((task) => (
          <article
            key={task.id}
            className={`task-square ${task.status === 'done' ? 'task-square--done' : ''}`.trim()}
            onClick={() => onToggleTaskDone(task.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onToggleTaskDone(task.id)
            }}
            role="button"
            tabIndex={0}
          >
            <img
              className="task-square__priority-image"
              src={
                task.priority === 'high'
                  ? uiAssets.priority.high
                  : task.priority === 'normal'
                    ? uiAssets.priority.normal
                    : uiAssets.priority.low
              }
              alt={`Priorité ${task.priority}`}
            />
            <img
              className="task-square__status-image"
              src={
                task.status === 'done'
                  ? uiAssets.status.done
                  : task.status === 'in_progress'
                    ? uiAssets.status.inProgress
                    : uiAssets.status.todo
              }
              alt={`Statut ${task.status}`}
            />
            <button
              className="task-square__check"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onToggleTaskDone(task.id)
              }}
              title={task.status === 'done' ? 'Marquer à faire' : 'Marquer terminée'}
            >
              {task.status === 'done' ? '✓' : '○'}
            </button>
            <h4>{task.title}</h4>
            <p>{task.status === 'done' ? 'Fait' : task.status === 'in_progress' ? 'En cours' : 'À faire'}</p>
          </article>
        ))}
      </div>
      {sortedTasks.length === 0 ? <p className="empty">Aucune tâche pour {label}.</p> : null}
    </Modal>
  )
}
