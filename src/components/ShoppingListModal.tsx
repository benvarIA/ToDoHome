import { type FormEvent, useMemo, useRef, useState } from 'react'
import type { Task } from '../domain/types'
import { Modal } from './Modal'

interface ShoppingListModalProps {
  open: boolean
  tasks: Task[]
  onClose: () => void
  onToggleTaskDone: (taskId: string) => void
  onAddItem: (title: string) => void
  onDeleteTask: (taskId: string) => void
}

const CLASSICS = [
  { emoji: '🥛', label: 'Lait' },
  { emoji: '🥚', label: 'Œufs' },
  { emoji: '🧈', label: 'Beurre' },
  { emoji: '🧀', label: 'Fromage' },
  { emoji: '🍞', label: 'Pain' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍫', label: 'Chocolat' },
  { emoji: '🍝', label: 'Pâtes' },
  { emoji: '🍚', label: 'Riz' },
  { emoji: '🍅', label: 'Tomates' },
  { emoji: '🥕', label: 'Carottes' },
  { emoji: '🧅', label: 'Oignons' },
  { emoji: '🥗', label: 'Salade' },
  { emoji: '🍋', label: 'Citrons' },
  { emoji: '🍌', label: 'Bananes' },
  { emoji: '🧄', label: 'Ail' },
  { emoji: '🍗', label: 'Poulet' },
  { emoji: '🐟', label: 'Poisson' },
  { emoji: '🧻', label: 'PQ' },
  { emoji: '🍷', label: 'Vin' },
]

export const ShoppingListModal = ({
  open,
  tasks,
  onClose,
  onToggleTaskDone,
  onAddItem,
  onDeleteTask,
}: ShoppingListModalProps) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const doneDelta = Number(a.status === 'done') - Number(b.status === 'done')
      if (doneDelta !== 0) return doneDelta
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [tasks])

  const pendingCount = sortedTasks.filter((t) => t.status !== 'done').length

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const val = input.trim()
    if (!val) return
    onAddItem(val)
    setInput('')
    inputRef.current?.focus()
  }

  const addClassic = (label: string, emoji: string) => {
    const alreadyExists = tasks.some(
      (t) => t.status !== 'done' && t.title.toLowerCase().includes(label.toLowerCase()),
    )
    if (alreadyExists) return
    onAddItem(`${emoji} ${label}`)
  }

  return (
    <Modal open={open} title="🛒 Liste de courses" onClose={onClose} className="modal--shopping" closeIconOnly>
      <div className="shopping-layout">
        <aside className="shopping-editor">
          <form className="shopping-editor__form" onSubmit={submit}>
            <label className="shopping-editor__label" htmlFor="shopping-input">
              Ajouter un article
            </label>
            <input
              id="shopping-input"
              ref={inputRef}
              className="input shopping-editor__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: yaourts, jambon…"
              autoComplete="off"
            />
            <button className="btn shopping-editor__btn" type="submit">
              + Ajouter
            </button>
          </form>

          <div className="shopping-classics">
            <p className="shopping-classics__title">Classiques</p>
            <div className="shopping-classics__grid">
              {CLASSICS.map(({ emoji, label }) => {
                const alreadyPending = tasks.some(
                  (t) => t.status !== 'done' && t.title.toLowerCase().includes(label.toLowerCase()),
                )
                return (
                  <button
                    key={label}
                    type="button"
                    className={`shopping-classic-chip${alreadyPending ? ' shopping-classic-chip--done' : ''}`}
                    onClick={() => addClassic(label, emoji)}
                    disabled={alreadyPending}
                  >
                    <span className="shopping-classic-chip__emoji">{emoji}</span>
                    <span className="shopping-classic-chip__label">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="shopping-list">
          <p className="shopping-list__counter">
            {pendingCount === 0 ? 'Rien à acheter 🎉' : `${pendingCount} article${pendingCount > 1 ? 's' : ''} restant${pendingCount > 1 ? 's' : ''}`}
          </p>
          <div className="shopping-list__items">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`shopping-item${task.status === 'done' ? ' shopping-item--done' : ''}`}
              >
                <button
                  type="button"
                  className="shopping-item__toggle"
                  onClick={() => onToggleTaskDone(task.id)}
                >
                  <input type="checkbox" checked={task.status === 'done'} readOnly tabIndex={-1} />
                  <span>{task.title.replace(/^🛒\s*/, '')}</span>
                </button>
                <button
                  type="button"
                  className="shopping-item__delete"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
            {sortedTasks.length === 0 && (
              <p className="shopping-list__empty">La liste est vide. Ajoute des articles à gauche !</p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  )
}
