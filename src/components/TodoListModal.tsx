import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { Task } from '../domain/types'
import { Modal } from './Modal'

interface TodoListModalProps {
  open: boolean
  title: string
  backgroundImage: string
  tasks: Task[]
  onClose: () => void
  onToggleTaskDone: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

const priorityRank = { high: 3, normal: 2, low: 1 }

export const TodoListModal = ({
  open,
  title,
  backgroundImage,
  tasks,
  onClose,
  onToggleTaskDone,
  onDeleteTask,
}: TodoListModalProps) => {
  const sortedTasks = useMemo(() => {
    const items = [...tasks]
    items.sort((a, b) => {
      const doneDelta = Number(a.status === 'done') - Number(b.status === 'done')
      if (doneDelta !== 0) return doneDelta
      const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority]
      if (priorityDelta !== 0) return priorityDelta
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    return items
  }, [tasks])

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      className="modal modal--todo-text"
      style={{ '--todo-bg-image': `url(${backgroundImage})` } as CSSProperties}
      closeIconOnly
    >
      <div className="todo-text-list">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className={`todo-text-item ${task.status === 'done' ? 'todo-text-item--done' : ''}`.trim()}
          >
            <button
              type="button"
              className="todo-text-item__toggle"
              onClick={() => onToggleTaskDone(task.id)}
            >
              <input
                type="checkbox"
                checked={task.status === 'done'}
                readOnly
                tabIndex={-1}
              />
              <span>{task.title}</span>
            </button>
            <button
              type="button"
              className="todo-text-item__delete"
              onClick={() => onDeleteTask(task.id)}
              aria-label="Supprimer"
            >
              ×
            </button>
          </div>
        ))}
        {sortedTasks.length === 0 ? <p className="empty">Aucune tâche.</p> : null}
      </div>
    </Modal>
  )
}
