import { type FormEvent, useEffect, useRef, useState } from 'react'
import type { Assignee, Priority, Room, SubTask, Task, TaskStatus } from '../domain/types'

const STATUS_OPTS: { value: TaskStatus; label: string; cls: string }[] = [
  { value: 'todo',        label: 'À faire',  cls: 'todo'     },
  { value: 'in_progress', label: 'En cours', cls: 'progress' },
  { value: 'done',        label: 'Terminé',  cls: 'done'     },
]
const PRIORITY_OPTS: { value: Priority; label: string; cls: string }[] = [
  { value: 'low',    label: 'Faible', cls: 'low'    },
  { value: 'normal', label: 'Normal', cls: 'normal' },
  { value: 'high',   label: 'Urgent', cls: 'high'   },
]

interface TaskModalProps {
  open: boolean
  taskId: string | null
  task: Task | null
  defaultRoomId: string | null
  defaultAssignee?: Assignee
  rooms: Room[]
  image: string
  onClose: () => void
  onSave: (payload: {
    id?: string
    title: string
    description: string
    roomId: string | null
    status: TaskStatus
    priority: Priority
    assignee: Assignee
    dueDate: string | null
    color: string
    subtasks: SubTask[]
  }) => void
  onDelete: (taskId: string) => void
  onCreateEvent: (taskId: string) => void
}

export const TaskModal = ({
  open,
  taskId,
  task,
  defaultRoomId,
  defaultAssignee = null,
  rooms,
  image,
  onClose,
  onSave,
  onDelete,
  onCreateEvent,
}: TaskModalProps) => {
  const titleRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(!task)
  const [titleError, setTitleError] = useState(false)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [roomId, setRoomId] = useState<string | null>(task?.roomId ?? defaultRoomId ?? null)
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'low')
  const [assignee, setAssignee] = useState<Assignee>(task?.assignee ?? defaultAssignee ?? null)
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const lockRoom     = !task && defaultRoomId !== null
  const lockAssignee = !task && defaultAssignee !== null

  useEffect(() => {
    if (!open) return
    setIsEditing(!task)
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setRoomId(task?.roomId ?? defaultRoomId ?? null)
    setStatus(task?.status ?? 'todo')
    setPriority(task?.priority ?? 'low')
    setAssignee(task?.assignee ?? defaultAssignee ?? null)
    setDueDate(task?.dueDate ?? '')
  }, [open, task?.id])

  useEffect(() => {
    if (!open || (task && !isEditing)) return
    const t = setTimeout(() => titleRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isEditing, open])

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()
      // Reset class after animation (380ms) so it can re-trigger if user clicks again
      setTimeout(() => setTitleError(false), 420)
      return
    }
    onSave({
      id: task?.id ?? taskId ?? undefined,
      title: title.trim(),
      description: description.trim(),
      roomId,
      status,
      priority,
      assignee,
      dueDate: dueDate || null,
      color: task?.color ?? '#fbbf24',
      subtasks: task?.subtasks ?? ([] as SubTask[]),
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    handleSave()
  }

  const formattedDate = task?.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  if (!open) return null

  return (
    <div
      className="ts-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="ts-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={task ? task.title : 'Nouvelle tâche'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero image ── */}
        <div className="ts-hero">
          <img src={image} className="ts-hero__img" alt="" aria-hidden="true" />
          <div className="ts-hero__gradient" />
          <div className="ts-hero__handle" aria-hidden="true" />
          <button className="ts-hero__close" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
          {task && !isEditing && (
            <div className="ts-hero__foot">
              <h2 className="ts-hero__title">{task.title}</h2>
            </div>
          )}
        </div>

        {/* ── Corps ── */}
        <div className="ts-body">
          {task && !isEditing ? (
            /* ─ Vue détail ─ */
            <>
              <div className="ts-pill-row">
                {STATUS_OPTS.map((o) => (
                  <span key={o.value} className={`ts-pill ts-pill--${o.cls}${task.status === o.value ? ' ts-pill--on' : ''}`}>
                    {o.label}
                  </span>
                ))}
              </div>
              <div className="ts-pill-row">
                {PRIORITY_OPTS.map((o) => (
                  <span key={o.value} className={`ts-pill ts-pill--prio-${o.cls}${task.priority === o.value ? ' ts-pill--on' : ''}`}>
                    <span className="ts-pill__dot" />
                    {o.label}
                  </span>
                ))}
              </div>
              {task.assignee && (
                <div className="ts-pill-row">
                  <span className={`ts-pill ts-pill--${task.assignee === 'wife' ? 'camille' : 'benoit'} ts-pill--on`}>
                    <span className="ts-pill__avatar">{task.assignee === 'wife' ? 'C' : 'B'}</span>
                    {task.assignee === 'wife' ? 'Camille' : 'Benoit'}
                  </span>
                </div>
              )}
              {task.description ? (
                <p className="ts-desc">{task.description}</p>
              ) : (
                <p className="ts-desc ts-desc--empty">Pas de description.</p>
              )}
              {formattedDate && (
                <p className="ts-date">Échéance · {formattedDate}</p>
              )}
            </>
          ) : (
            /* ─ Vue édition ─ */
            <form onSubmit={submit} className="ts-edit-form">
              <input
                ref={titleRef}
                className={`ts-title-input${titleError ? ' ts-title-input--error' : ''}`}
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false) }}
                placeholder="Nom de la tâche…"
              />

              <div className="ts-field-group">
                <div className="ts-pill-row">
                  {STATUS_OPTS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`ts-pill ts-pill--${o.cls}${status === o.value ? ' ts-pill--on' : ''}`}
                      onClick={() => setStatus(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <div className="ts-pill-row">
                  {PRIORITY_OPTS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`ts-pill ts-pill--prio-${o.cls}${priority === o.value ? ' ts-pill--on' : ''}`}
                      onClick={() => setPriority(o.value)}
                    >
                      <span className="ts-pill__dot" />
                      {o.label}
                    </button>
                  ))}
                </div>

                <div className="ts-pill-row">
                  {!lockAssignee ? (
                    <>
                      <button
                        type="button"
                        className={`ts-pill ts-pill--benoit${assignee === 'me' ? ' ts-pill--on' : ''}`}
                        onClick={() => setAssignee((c) => (c === 'me' ? null : 'me'))}
                      >
                        <span className="ts-pill__avatar">B</span>
                        Benoit
                      </button>
                      <button
                        type="button"
                        className={`ts-pill ts-pill--camille${assignee === 'wife' ? ' ts-pill--on' : ''}`}
                        onClick={() => setAssignee((c) => (c === 'wife' ? null : 'wife'))}
                      >
                        <span className="ts-pill__avatar">C</span>
                        Camille
                      </button>
                    </>
                  ) : (
                    <span className={`ts-pill ts-pill--${defaultAssignee === 'wife' ? 'camille' : 'benoit'} ts-pill--on`}>
                      <span className="ts-pill__avatar">{defaultAssignee === 'wife' ? 'C' : 'B'}</span>
                      {defaultAssignee === 'wife' ? 'Camille' : 'Benoit'}
                    </span>
                  )}
                </div>
              </div>

              {!lockRoom && (
                <select
                  className="ts-select"
                  value={roomId ?? 'overall'}
                  onChange={(e) => setRoomId(e.target.value === 'overall' ? null : e.target.value)}
                >
                  <option value="overall">Générale</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}

              <textarea
                className="ts-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Notes optionnelles…"
              />

              <input
                className="ts-date-input"
                type="date"
                value={dueDate ? dueDate.slice(0, 10) : ''}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </form>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="ts-actions">
          {task && !isEditing ? (
            <>
              <button
                className="ts-btn ts-btn--edit"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </button>
              <button
                className="ts-btn ts-btn--agenda"
                type="button"
                onClick={() => onCreateEvent(task.id)}
              >
                Agenda
              </button>
              <button
                className="ts-btn ts-btn--delete"
                type="button"
                onClick={() => onDelete(task.id)}
              >
                Supprimer
              </button>
            </>
          ) : (
            <>
              <button
                className="ts-btn ts-btn--save"
                type="button"
                onClick={handleSave}
              >
                {task ? 'Enregistrer' : 'Créer la tâche'}
              </button>
              {task && (
                <button
                  className="ts-btn ts-btn--cancel"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
