import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDraftModal } from './components/CalendarDraftModal'
import { ConfirmModal } from './components/ConfirmModal'
import { RoomCard } from './components/RoomCard'
import { RoomPieChart } from './components/RoomPieChart'
import { RoomModal } from './components/RoomModal'
import { TaskModal } from './components/TaskModal'
import { TodoListModal } from './components/TodoListModal'
import { ShoppingListModal } from './components/ShoppingListModal'
import { roomImageForName } from './domain/imageCatalog'
import { uiAssets } from './domain/uiAssets'
import type { Room, Task } from './domain/types'
import { AppStoreProvider, useAppStore } from './store/AppStore'

interface TerminalMessage {
  id: string
  role: 'user' | 'codex'
  text: string
}

type PlannedAction =
  | {
      kind: 'add_task'
      title: string
      description: string
      roomId: string | null
      assignee: 'me' | 'wife' | null
      status: 'todo' | 'in_progress' | 'done'
      priority: 'low' | 'normal' | 'high'
    }
  | {
      kind: 'toggle_done'
      taskId: string
      title: string
    }

interface PendingProposal {
  actions: PlannedAction[]
  summary: string
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

interface ShoppingListInlineProps {
  tasks: Task[]
  onToggleTaskDone: (taskId: string) => void
  onAddItem: (title: string) => void
  onDeleteTask: (taskId: string) => void
}

const ShoppingListInline = ({ tasks, onToggleTaskDone, onAddItem, onDeleteTask }: ShoppingListInlineProps) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [tasks],
  )

  const doneTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'done')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tasks],
  )

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

  const clearDone = () => {
    for (const task of doneTasks) onDeleteTask(task.id)
  }

  const cleanLabel = (title: string) => title.replace(/^🛒\s*/, '')

  return (
    <div className="sl">
      {/* Header */}
      <div className="sl__header">
        <div className="sl__header-left">
          <span className="sl__icon">🛒</span>
          <h2 className="sl__title">Courses</h2>
          {pendingTasks.length > 0 && (
            <span className="sl__badge">{pendingTasks.length}</span>
          )}
        </div>
        {doneTasks.length > 0 && (
          <button type="button" className="sl__clear-btn" onClick={clearDone}>
            Vider cochés
          </button>
        )}
      </div>

      {/* Classics strip */}
      <div className="sl__classics-strip">
        {CLASSICS.map(({ emoji, label }) => {
          const alreadyPending = tasks.some(
            (t) => t.status !== 'done' && t.title.toLowerCase().includes(label.toLowerCase()),
          )
          return (
            <button
              key={label}
              type="button"
              className={`sl__classic${alreadyPending ? ' sl__classic--in' : ''}`}
              onClick={() => addClassic(label, emoji)}
              disabled={alreadyPending}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Items list */}
      <div className="sl__list">
        {pendingTasks.length === 0 && doneTasks.length === 0 && (
          <div className="sl__empty">
            <p>🎉</p>
            <p>La liste est vide !</p>
            <p>Ajoute un article ci-dessous.</p>
          </div>
        )}

        {pendingTasks.length === 0 && doneTasks.length > 0 && (
          <div className="sl__empty">
            <p>✅ Tout est dans le panier !</p>
          </div>
        )}

        {pendingTasks.map((task) => (
          <div key={task.id} className="sl__item">
            <button
              type="button"
              className="sl__item-toggle"
              onClick={() => onToggleTaskDone(task.id)}
              aria-label="Cocher"
            >
              <span className="sl__item-check" />
              <span className="sl__item-label">{cleanLabel(task.title)}</span>
            </button>
            <button
              type="button"
              className="sl__item-delete"
              onClick={() => onDeleteTask(task.id)}
              aria-label="Supprimer"
            >
              ×
            </button>
          </div>
        ))}

        {doneTasks.length > 0 && (
          <p className="sl__done-sep">Dans le panier ({doneTasks.length})</p>
        )}

        {doneTasks.map((task) => (
          <div key={task.id} className="sl__item sl__item--done">
            <button
              type="button"
              className="sl__item-toggle"
              onClick={() => onToggleTaskDone(task.id)}
              aria-label="Décocher"
            >
              <span className="sl__item-check sl__item-check--done">✓</span>
              <span className="sl__item-label">{cleanLabel(task.title)}</span>
            </button>
            <button
              type="button"
              className="sl__item-delete"
              onClick={() => onDeleteTask(task.id)}
              aria-label="Supprimer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Bottom input bar */}
      <form className="sl__bar" onSubmit={submit}>
        <input
          ref={inputRef}
          className="sl__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter un article…"
          autoComplete="off"
          autoCorrect="off"
        />
        <button className="sl__add-btn" type="submit" aria-label="Ajouter">
          +
        </button>
      </form>
    </div>
  )
}

const sortTasksForTodoList = (items: Task[]) => {
  const priorityRank = { high: 3, normal: 2, low: 1 }
  return [...items].sort((a, b) => {
    const doneDelta = Number(a.status === 'done') - Number(b.status === 'done')
    if (doneDelta !== 0) return doneDelta
    const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority]
    if (priorityDelta !== 0) return priorityDelta
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

const normalizeCommand = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractSpeaker = (normalized: string): 'me' | 'wife' | null => {
  if (
    normalized.includes("c'est benoit") ||
    normalized.includes('c est benoit') ||
    normalized.includes('je suis benoit') ||
    normalized.includes('benoit ici')
  ) {
    return 'me'
  }
  if (
    normalized.includes("c'est camille") ||
    normalized.includes('c est camille') ||
    normalized.includes('je suis camille') ||
    normalized.includes('camille ici')
  ) {
    return 'wife'
  }
  return null
}

const extractShoppingItem = (normalized: string) => {
  const addMatch = normalized.match(/(?:ajoute|ajouter|mets|mettre)\s+(.+)/)
  if (!addMatch?.[1]) return ''
  return addMatch[1]
    .replace(/\b(a|au|aux)\b.*\bliste\b.*\bcourses?\b/g, '')
    .replace(/\bliste\b.*\bcourses?\b/g, '')
    .replace(/\bcourses?\b/g, '')
    .trim()
}

const extractNeedShoppingItems = (normalized: string) => {
  const patterns = [
    /(?:j'ai besoin de|jai besoin de|j ai besoin de)\s+(.+)/,
    /(?:il faut|faut)\s+(.+)/,
    /(?:on manque de|plus de)\s+(.+)/,
  ]
  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (!match?.[1]) continue
    const cleaned = match[1]
      .replace(/\bpour\b.*$/, '')
      .replace(/\bsvp\b/g, '')
      .trim()
    const items = cleaned
      .split(/\bet\b|,/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12)
    if (items.length > 0) return items
  }
  return []
}

const AppLayout = () => {
  const {
    state,
    sortedRooms,
    setTab,
    deleteRoom,
    updateRoom,
    openRoomModal,
    openTaskModal,
    closeTaskModal,
    saveTask,
    toggleTaskDone,
    addRecurringPlan,
    updateRecurringPlan,
    deleteRecurringPlan,
    syncRecurringTasks,
    deleteTask,
    reorderRooms,
    openCalendarDraft,
    updateCalendarDraft,
    confirmCalendarEvent,
    closeCalendarDraft,
    setDragRoom,
  } = useAppStore()

  const [quickTitle, setQuickTitle] = useState('')
  const [quickRoomId, setQuickRoomId] = useState('overall')
  const [shoppingItem, setShoppingItem] = useState('')
  const [activePreset, setActivePreset] = useState<'courses' | 'none'>('none')
  const [activeRecurring, setActiveRecurring] = useState<string | null>(null)
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null)
  const [recurringFrequencyDays, setRecurringFrequencyDays] = useState('14')
  const [recurringRoomId, setRecurringRoomId] = useState('overall')
  const [recurringNextDueDate, setRecurringNextDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<null | { id: string; name: string }>(null)
  const [pendingDeleteTask, setPendingDeleteTask] = useState<null | { id: string; title: string }>(null)
  const [pendingDeleteRecurring, setPendingDeleteRecurring] = useState<null | { id: string; title: string }>(null)
  const [todoListTarget, setTodoListTarget] = useState<string | 'overall' | 'assignee-me' | 'assignee-wife' | null>(null)
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set())
  const [quickEditTaskId, setQuickEditTaskId] = useState<string | null>(null)
  const [quickEditTitle, setQuickEditTitle] = useState('')
  const quickEditRef = useRef<HTMLInputElement>(null)

  const toggleCardCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startQuickEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setQuickEditTaskId(task.id)
    setQuickEditTitle(task.title)
    setTimeout(() => quickEditRef.current?.select(), 10)
  }

  const commitQuickEdit = () => {
    if (!quickEditTaskId) return
    const task = state.data.tasks.find((t) => t.id === quickEditTaskId)
    if (task && quickEditTitle.trim()) {
      saveTask({ ...task, title: quickEditTitle.trim() })
    }
    setQuickEditTaskId(null)
    setQuickEditTitle('')
  }
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<TerminalMessage[]>([
    { id: 'm-1', role: 'codex', text: 'Terminal Codex prêt. Donne une commande, je propose un plan, puis tu valides avec "oui".' },
  ])
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null)
  const aiLogRef = useRef<HTMLDivElement | null>(null)
  const notificationTimeoutRef = useRef<number | null>(null)
  const heroImage = uiAssets.hero
  const overallImage = uiAssets.overall
  const calendarModalImage = uiAssets.topButtons.todo
  const appBackground = state.ui.activeTab === 'house' ? 'none' : `url(${heroImage})`

  const roomModal = sortedRooms.find((room) => room.id === state.ui.roomModalId) ?? null
  const taskModalTask = state.data.tasks.find((task) => task.id === state.ui.taskModal.taskId) ?? null
  const taskModalImage = useMemo(() => {
    const sourceRoomId = taskModalTask?.roomId ?? state.ui.taskModal.roomId
    if (!sourceRoomId) return overallImage
    const room = sortedRooms.find((item) => item.id === sourceRoomId)
    return room ? room.image || roomImageForName(room.name) : overallImage
  }, [overallImage, sortedRooms, state.ui.taskModal.roomId, taskModalTask?.roomId])
  const shoppingTasks = useMemo(
    () => state.data.tasks.filter((task) => task.description === 'Liste Courses' || task.title.trim().startsWith('🛒')),
    [state.data.tasks],
  )
  const todoListTasks = useMemo(() => {
    if (todoListTarget === null) return []
    if (todoListTarget === 'overall') return state.data.tasks
    if (todoListTarget === 'assignee-me') return state.data.tasks.filter((task) => task.assignee === 'me')
    if (todoListTarget === 'assignee-wife') return state.data.tasks.filter((task) => task.assignee === 'wife')
    return state.data.tasks.filter((task) => task.roomId === todoListTarget)
  }, [state.data.tasks, todoListTarget])
  const todoListTitle = useMemo(() => {
    if (todoListTarget === null) return ''
    if (todoListTarget === 'overall') return 'Todo Générale'
    if (todoListTarget === 'assignee-me') return 'Todo Benoit'
    if (todoListTarget === 'assignee-wife') return 'Todo Camille'
    return `Todo ${sortedRooms.find((room) => room.id === todoListTarget)?.name ?? ''}`.trim()
  }, [sortedRooms, todoListTarget])
  const todoListBackgroundImage = useMemo(() => {
    if (todoListTarget === null) return overallImage
    if (todoListTarget === 'overall') return overallImage
    if (todoListTarget === 'assignee-me') return uiAssets.overall
    if (todoListTarget === 'assignee-wife') return uiAssets.overall
    const room = sortedRooms.find((item) => item.id === todoListTarget)
    return room ? room.image || roomImageForName(room.name) : overallImage
  }, [overallImage, sortedRooms, todoListTarget])
  const benoitTasks = useMemo(
    () => sortTasksForTodoList(state.data.tasks.filter((task) => task.assignee === 'me')),
    [state.data.tasks],
  )
  const camilleTasks = useMemo(
    () => sortTasksForTodoList(state.data.tasks.filter((task) => task.assignee === 'wife')),
    [state.data.tasks],
  )

  const roomTasksAll = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    for (const room of sortedRooms) grouped.set(room.id, [])
    for (const task of state.data.tasks) {
      if (!task.roomId) continue
      if (!grouped.has(task.roomId)) grouped.set(task.roomId, [])
      grouped.get(task.roomId)!.push(task)
    }
    return grouped
  }, [sortedRooms, state.data.tasks])

  const roomTasksAllForTodo = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    for (const room of sortedRooms) grouped.set(room.id, [])
    for (const task of state.data.tasks) {
      if (!task.roomId) continue
      if (!grouped.has(task.roomId)) grouped.set(task.roomId, [])
      grouped.get(task.roomId)!.push(task)
    }
    return grouped
  }, [sortedRooms, state.data.tasks])

  const openTasksPerRoom = useMemo(() => {
    const counts = new Map<string, number>()
    for (const room of sortedRooms) counts.set(room.id, 0)
    for (const task of state.data.tasks) {
      if (!task.roomId || task.status === 'done') continue
      counts.set(task.roomId, (counts.get(task.roomId) ?? 0) + 1)
    }
    return counts
  }, [sortedRooms, state.data.tasks])

  const totalOpenHouseTasks = useMemo(
    () => Array.from(openTasksPerRoom.values()).reduce((sum, count) => sum + count, 0),
    [openTasksPerRoom],
  )

  const leaderRoomId = useMemo(() => {
    let leaderId: string | null = null
    let best = -1
    for (const room of sortedRooms) {
      const value = openTasksPerRoom.get(room.id) ?? 0
      if (value > best) {
        best = value
        leaderId = room.id
      }
    }
    if (best <= 0) return null
    return leaderId
  }, [openTasksPerRoom, sortedRooms])

  const pieData = useMemo(
    () =>
      sortedRooms.map((room) => ({
        id: room.id,
        name: room.name,
        value: openTasksPerRoom.get(room.id) ?? 0,
        color: room.color,
      })),
    [openTasksPerRoom, sortedRooms],
  )

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    if (requestedTab === 'home' || requestedTab === 'house' || requestedTab === 'todo') {
      setTab(requestedTab)
    }
  }, [setTab])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (state.ui.taskModal.open) closeTaskModal()
      if (state.ui.roomModalId) openRoomModal(null)
      if (state.ui.calendarDraft) closeCalendarDraft()
      if (todoListTarget) setTodoListTarget(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeCalendarDraft, closeTaskModal, openRoomModal, state.ui.calendarDraft, state.ui.roomModalId, state.ui.taskModal.open, todoListTarget])

  useEffect(() => {
    syncRecurringTasks()
  }, [state.data.recurringPlans, syncRecurringTasks])

  const recurringTemplates = [
    'Aspirateur',
    'Vitres',
    'Poussière',
    'Laver porte',
    'Laver sol',
  ]

  const findRoomIdsByKeywords = (rooms: Room[], keywords: string[]) => {
    const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase())
    return rooms
      .filter((room) => {
        const name = room.name.toLowerCase()
        return normalizedKeywords.some((keyword) => name.includes(keyword))
      })
      .map((room) => room.id)
  }

  const defaultRoomsForRecurringTask = (title: string, rooms: Room[]) => {
    const lower = title.toLowerCase()
    if (lower.includes('aspirateur')) return findRoomIdsByKeywords(rooms, ['salon', 'chambre', 'couloir'])
    if (lower.includes('vitres')) return findRoomIdsByKeywords(rooms, ['salon', 'cuisine', 'chambre'])
    if (lower.includes('poussi')) return findRoomIdsByKeywords(rooms, ['salon', 'chambre', 'couloir', 'bureau'])
    if (lower.includes('porte')) return findRoomIdsByKeywords(rooms, ['entrée', 'couloir', 'cuisine', 'salle de bain', 'wc'])
    if (lower.includes('sol')) return findRoomIdsByKeywords(rooms, ['salon', 'cuisine', 'couloir', 'chambre', 'salle de bain', 'wc'])
    return []
  }

  const showNotification = (message: string) => {
    setNotification(message)
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current)
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null)
      notificationTimeoutRef.current = null
    }, 2800)
  }

  const roomMentions = useMemo(
    () =>
      sortedRooms.map((room) => ({
        label: room.name,
        color: room.color,
      })),
    [sortedRooms],
  )

  const aiMentions = useMemo(() => {
    const fixedMentions = [
      { label: 'Courses', color: '#f59e0b' },
      { label: 'Todo', color: '#ec4899' },
      { label: 'Todo Générale', color: '#f97316' },
      { label: 'Todo Benoit', color: '#22c55e' },
      { label: 'Todo Camille', color: '#3b82f6' },
    ]
    return [...roomMentions, ...fixedMentions].sort((a, b) => b.label.length - a.label.length)
  }, [roomMentions])

  const renderAiText = (text: string) => {
    if (aiMentions.length === 0) return text
    const pattern = new RegExp(`(${aiMentions.map((entry) => escapeRegex(entry.label)).join('|')})`, 'gi')
    return text.split(pattern).map((part, index) => {
      const match = aiMentions.find((entry) => entry.label.toLowerCase() === part.toLowerCase())
      if (!match) return <span key={`txt-${index}`}>{part}</span>
      return (
        <span
          key={`mention-${index}`}
          className="ai-mention"
          style={{ '--mention-color': match.color } as CSSProperties}
        >
          {part}
        </span>
      )
    })
  }

  const handleAddShoppingItem = (title: string) => {
    saveTask({
      title: title.startsWith('🛒') || /^\p{Emoji}/u.test(title) ? title : `🛒 ${title}`,
      description: 'Liste Courses',
      roomId: null,
      status: 'todo',
      priority: 'normal',
      assignee: null,
      dueDate: null,
      color: '#f59e0b',
      subtasks: [],
    })
  }

  const resolveRoomIdFromText = (text: string) => {
    const normalized = normalizeCommand(text)
    const room = sortedRooms.find((item) => normalized.includes(normalizeCommand(item.name)))
    return room?.id ?? null
  }

  const proposeActions = (command: string): PendingProposal | null => {
    const normalized = normalizeCommand(command)
    const speaker = extractSpeaker(normalized)

    const needItems = extractNeedShoppingItems(normalized)
    if (needItems.length > 0) {
      return {
        actions: needItems.map((item) => ({
          kind: 'add_task' as const,
          title: `🛒 ${item}`,
          description: 'Liste Courses',
          roomId: null,
          assignee: speaker,
          status: 'todo' as const,
          priority: 'normal' as const,
        })),
        summary: `Je propose: ajouter ${needItems.length} article${needItems.length > 1 ? 's' : ''} à Courses (${needItems.join(', ')}).`,
      }
    }

    if (normalized.includes('course') && /(ajoute|ajouter|mets|mettre)/.test(normalized)) {
      const item = extractShoppingItem(normalized)
      if (!item) return null
      return {
        actions: [
          {
            kind: 'add_task',
            title: `🛒 ${item}`,
            description: 'Liste Courses',
            roomId: null,
            assignee: speaker,
            status: 'todo',
            priority: 'normal',
          },
        ],
        summary: `Je propose: ajouter 1 article à Courses (${item}).`,
      }
    }

    if (normalized.includes('lance la machine') || normalized.includes('lancer la machine') || normalized.includes("j'ai lance")) {
      const machineTask = state.data.tasks.find(
        (task) => task.status !== 'done' && normalizeCommand(task.title).includes('machine'),
      )
      if (machineTask) {
        return {
          actions: [{ kind: 'toggle_done', taskId: machineTask.id, title: machineTask.title }],
          summary: `Je propose: marquer terminée la tâche "${machineTask.title}".`,
        }
      }
      const machineRoom = sortedRooms.find((room) =>
        ['buanderie', 'salle de bain', 'cuisine'].some((keyword) =>
          normalizeCommand(room.name).includes(keyword),
        ),
      )
      return {
        actions: [
          {
            kind: 'add_task',
            title: 'Machine lancée',
            description: 'Commande AI',
            roomId: machineRoom?.id ?? null,
            assignee: speaker,
            status: 'done',
            priority: 'normal',
          },
        ],
        summary: 'Je propose: créer une entrée "Machine lancée".',
      }
    }

    if (/(ajoute|ajouter|cree|creer|crée|note|rappelle)/.test(normalized)) {
      const roomId = resolveRoomIdFromText(command)
      const raw = command
        .replace(/^(.*?)(ajoute|ajouter|cree|creer|crée|note|rappelle)\s+/i, '')
        .replace(/\bdans\s+la\s+[a-zA-ZÀ-ÿ' -]+$/i, '')
        .replace(/\bdans\s+le\s+[a-zA-ZÀ-ÿ' -]+$/i, '')
        .trim()
      const labels = raw
        .split(/\bet\b|,/i)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12)
      if (labels.length === 0) return null
      const actions: PlannedAction[] = labels.map((label) => ({
        kind: 'add_task',
        title: label.charAt(0).toUpperCase() + label.slice(1),
        description: 'Commande AI',
        roomId,
        assignee: speaker,
        status: 'todo',
        priority: 'normal',
      }))
      return {
        actions,
        summary: `Je propose: ajouter ${actions.length} tâche${actions.length > 1 ? 's' : ''} dans ${roomId ? sortedRooms.find((room) => room.id === roomId)?.name ?? 'la pièce' : 'Todo Générale'}.`,
      }
    }

    return null
  }

  const applyProposal = (proposal: PendingProposal) => {
    let added = 0
    let completed = 0
    for (const action of proposal.actions) {
      if (action.kind === 'add_task') {
        saveTask({
          title: action.title,
          description: action.description,
          roomId: action.roomId,
          status: action.status,
          priority: action.priority,
          assignee: action.assignee,
          dueDate: null,
          color: '#fbbf24',
          subtasks: [],
        })
        added += 1
      } else {
        toggleTaskDone(action.taskId)
        completed += 1
      }
    }
    if (added > 0) setTab('todo')
    const parts = []
    if (added > 0) parts.push(`${added} tâche${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''}`)
    if (completed > 0) parts.push(`${completed} tâche${completed > 1 ? 's' : ''} terminée${completed > 1 ? 's' : ''}`)
    showNotification(`Traité: ${parts.join(', ')}`)
    return `Exécuté: ${parts.join(', ')}.`
  }

  const executeCodexCommand = (command: string) => {
    const normalized = normalizeCommand(command)

    if (pendingProposal && /^(oui|ok|go|valider|confirmer)$/i.test(normalized)) {
      const result = applyProposal(pendingProposal)
      setPendingProposal(null)
      return result
    }

    if (pendingProposal && /^(non|annuler|stop|cancel)$/i.test(normalized)) {
      setPendingProposal(null)
      return 'Proposition annulée.'
    }

    if (normalized.includes('refresh') || normalized.includes('rafraich') || normalized.includes('actualise')) {
      window.location.reload()
      return 'Actualisation lancée.'
    }

    const proposal = proposeActions(command)
    if (proposal) {
      setPendingProposal(proposal)
      return `${proposal.summary}\nRéponds "oui" pour valider ou "non" pour annuler.`
    }

    showNotification('Commande non comprise.')
    return "Je n'ai pas compris. Exemple: \"Ajoute changer ampoule dans couloir\"."
  }

  const runAiCommand = (command: string) => {
    const response = executeCodexCommand(command)
    setAiMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text: command },
      { id: `codex-${Date.now() + 1}`, role: 'codex', text: response },
    ])
  }

  const submitAiCommand = () => {
    if (!aiInput.trim()) return
    const command = aiInput.trim()
    runAiCommand(command)
    setAiInput('')
  }

  const handleAiDecision = (decision: 'oui' | 'non') => {
    runAiCommand(decision)
  }

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current)
        notificationTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!aiLogRef.current) return
    aiLogRef.current.scrollTop = aiLogRef.current.scrollHeight
  }, [aiMessages, pendingProposal])

  return (
    <div
      className="app-shell"
      data-tab={state.ui.activeTab}
      style={{ '--app-background': appBackground } as CSSProperties}
    >
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => setTab('home')}>
          <h1>ToDoHome</h1>
        </button>
        <div className="inline-row">
          <button
            className={`pill pill--image ${state.ui.activeTab === 'home' ? 'pill--active' : ''}`}
            type="button"
            onClick={() => setTab('home')}
            aria-pressed={state.ui.activeTab === 'home'}
          >
            <img src={uiAssets.overall} alt="Courses" />
          </button>
          <button
            className={`pill pill--image ${state.ui.activeTab === 'house' ? 'pill--active' : ''}`}
            type="button"
            onClick={() => setTab('house')}
            aria-pressed={state.ui.activeTab === 'house'}
          >
            <img src={uiAssets.topButtons.maison} alt="Ma Maison" />
          </button>
          <button
            className={`pill pill--image ${state.ui.activeTab === 'todo' ? 'pill--active' : ''}`}
            type="button"
            onClick={() => setTab('todo')}
            aria-pressed={state.ui.activeTab === 'todo'}
          >
            <img src={uiAssets.topButtons.todo} alt="To Do" />
          </button>
        </div>
        <div className="topbar-right">
          <div className="topbar-tools">
            <button className="btn btn--ghost topbar-tool-btn" type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </div>
      </header>
      {notification ? <div className="app-toast">{notification}</div> : null}

      {state.ui.activeTab === 'home' ? (
        <ShoppingListInline
          tasks={shoppingTasks}
          onToggleTaskDone={toggleTaskDone}
          onAddItem={handleAddShoppingItem}
          onDeleteTask={deleteTask}
        />
      ) : null}

      {state.ui.activeTab === 'house' ? (
        <>
          <main className="board board--todo">
            {sortedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                tasks={roomTasksAll.get(room.id) ?? []}
                totalOpenHouseTasks={totalOpenHouseTasks}
                isLeader={leaderRoomId === room.id}
                colorMode="room"
                image={room.image || roomImageForName(room.name)}
                showManageActions
                showTaskList={false}
                onOpenRoom={() => openRoomModal(room.id)}
                onOpenTask={(taskId) => openTaskModal(taskId, room.id)}
                onDragStart={() => setDragRoom(room.id)}
                onDrop={() => {
                  if (state.ui.dragRoomId) reorderRooms(state.ui.dragRoomId, room.id)
                  setDragRoom(null)
                }}
                onRequestDeleteRoom={() => setPendingDeleteRoom({ id: room.id, name: room.name })}
              />
            ))}
          </main>
          <RoomPieChart data={pieData} />
        </>
      ) : null}

      {state.ui.activeTab === 'todo' ? (
        <main className="todo-list-view">
          {(
            [
              { id: 'assignee-me', label: 'Benoit', color: '#22c55e', tasks: benoitTasks, img: heroImage, roomId: null as string | null },
              { id: 'assignee-wife', label: 'Camille', color: '#f97316', tasks: camilleTasks, img: heroImage, roomId: null as string | null },
              ...sortedRooms
                .filter((room) => (roomTasksAllForTodo.get(room.id) ?? []).length > 0)
                .map((room) => ({
                  id: room.id,
                  label: room.name,
                  color: room.color,
                  tasks: sortTasksForTodoList(roomTasksAllForTodo.get(room.id) ?? []),
                  img: room.image || roomImageForName(room.name),
                  roomId: room.id,
                })),
            ] as { id: string; label: string; color: string; tasks: Task[]; img: string; roomId: string | null }[]
          ).map(({ id, label, color, tasks, img, roomId }) => {
            const collapsed = collapsedCards.has(id)
            const openCount = tasks.filter((t) => t.status !== 'done').length
            return (
              <article key={id} className="todo-card" style={{ '--tc': color, '--tc-img': `url(${img})` } as CSSProperties}>
                {/* Banner image cliquable → ouvre la liste complète */}
                <button type="button" className="todo-card__banner" onClick={() => setTodoListTarget(id)}>
                  <div className="todo-card__banner-foot">
                    <span className="todo-card__label">{label}</span>
                    <div className="todo-card__banner-right">
                      {openCount > 0 && <span className="todo-card__badge">{openCount}</span>}
                    </div>
                  </div>
                </button>
                {/* Toggle collapse */}
                <button type="button" className="todo-card__toggle" onClick={(e) => toggleCardCollapse(id, e)}>
                  {collapsed ? '＋' : '－'}
                </button>
                {/* Liste dépliée */}
                {!collapsed && (
                  <ul className="todo-card__list">
                    {tasks.length === 0 && (
                      <li className="todo-card__empty">Rien pour l'instant ✨</li>
                    )}
                    {tasks.slice(0, 6).map((task) => (
                      <li key={task.id} className={`todo-card__item${task.status === 'done' ? ' todo-card__item--done' : ''}`}>
                        <button
                          type="button"
                          className="todo-card__check"
                          onClick={(e) => { e.stopPropagation(); toggleTaskDone(task.id) }}
                        />
                        {quickEditTaskId === task.id ? (
                          <input
                            ref={quickEditRef}
                            className="todo-card__quick-input"
                            value={quickEditTitle}
                            onChange={(e) => setQuickEditTitle(e.target.value)}
                            onBlur={commitQuickEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitQuickEdit()
                              if (e.key === 'Escape') { setQuickEditTaskId(null); setQuickEditTitle('') }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="todo-card__task-text" onClick={(e) => startQuickEdit(task, e)}>
                            {task.title}
                          </span>
                        )}
                        <button
                          type="button"
                          className="todo-card__open"
                          onClick={(e) => { e.stopPropagation(); openTaskModal(task.id, roomId) }}
                        >⋯</button>
                      </li>
                    ))}
                    {tasks.length > 6 && (
                      <li className="todo-card__item todo-card__item--more">
                        <button type="button" onClick={() => setTodoListTarget(id)}>
                          +{tasks.length - 6} de plus
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </article>
            )
          })}
        </main>
      ) : null}


      <RoomModal
        room={roomModal}
        roomTasks={state.data.tasks.filter((task) => task.roomId === roomModal?.id)}
        roomImage={roomModal ? roomModal.image || roomImageForName(roomModal.name) : null}
        onClose={() => openRoomModal(null)}
        onOpenTask={(taskId) => openTaskModal(taskId, roomModal?.id ?? null)}
        onToggleTaskDone={toggleTaskDone}
        onCreateTask={(roomId) => openTaskModal(null, roomId)}
        onRoomColorChange={(room, color) => updateRoom({ ...room, color })}
      />

      <TodoListModal
        open={todoListTarget !== null}
        title={todoListTitle}
        backgroundImage={todoListBackgroundImage}
        tasks={todoListTasks}
        onClose={() => setTodoListTarget(null)}
        onToggleTaskDone={toggleTaskDone}
        onDeleteTask={deleteTask}
      />

      <ShoppingListModal
        open={shoppingOpen}
        tasks={shoppingTasks}
        onClose={() => setShoppingOpen(false)}
        onToggleTaskDone={toggleTaskDone}
        onAddItem={handleAddShoppingItem}
        onDeleteTask={deleteTask}
      />

      <TaskModal
        key={`${state.ui.taskModal.open ? 'open' : 'closed'}-${state.ui.taskModal.taskId ?? 'new'}-${state.ui.taskModal.roomId ?? 'overall'}-${state.ui.taskModal.assignee ?? 'none'}`}
        open={state.ui.taskModal.open}
        taskId={state.ui.taskModal.taskId}
        task={taskModalTask}
        defaultRoomId={state.ui.taskModal.roomId}
        defaultAssignee={state.ui.taskModal.assignee}
        rooms={sortedRooms}
        image={taskModalImage}
        onClose={closeTaskModal}
        onSave={saveTask}
        onDelete={deleteTask}
        onCreateEvent={openCalendarDraft}
      />

      <CalendarDraftModal
        open={Boolean(state.ui.calendarDraft)}
        draft={state.ui.calendarDraft?.data ?? null}
        image={calendarModalImage}
        onClose={closeCalendarDraft}
        onChange={updateCalendarDraft}
        onConfirm={confirmCalendarEvent}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteRoom)}
        title="Supprimer la pièce"
        message={
          pendingDeleteRoom
            ? `Supprimer la pièce "${pendingDeleteRoom.name}" ? Les tâches seront déplacées vers Générale.`
            : ''
        }
        confirmLabel="Supprimer"
        onCancel={() => setPendingDeleteRoom(null)}
        onConfirm={() => {
          if (!pendingDeleteRoom) return
          deleteRoom(pendingDeleteRoom.id)
          setPendingDeleteRoom(null)
        }}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteTask)}
        title="Supprimer la tâche"
        message={pendingDeleteTask ? `Supprimer la tâche "${pendingDeleteTask.title}" ?` : ''}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDeleteTask(null)}
        onConfirm={() => {
          if (!pendingDeleteTask) return
          deleteTask(pendingDeleteTask.id)
          setPendingDeleteTask(null)
        }}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteRecurring)}
        title="Supprimer la tâche récurrente"
        message={pendingDeleteRecurring ? `Supprimer la tâche récurrente "${pendingDeleteRecurring.title}" ?` : ''}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDeleteRecurring(null)}
        onConfirm={() => {
          if (!pendingDeleteRecurring) return
          deleteRecurringPlan(pendingDeleteRecurring.id)
          setPendingDeleteRecurring(null)
        }}
      />
    </div>
  )
}

function App() {
  return (
    <AppStoreProvider>
      <AppLayout />
    </AppStoreProvider>
  )
}

export default App
