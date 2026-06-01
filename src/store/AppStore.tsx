/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import type {
  AppTab,
  Assignee,
  CalendarEventDraft,
  ColorMode,
  Filters,
  PersistedStateV1,
  Priority,
  RecurringPlan,
  Room,
  SortOption,
  SubTask,
  Task,
  TaskStatus,
} from '../domain/types'
import { loadRemoteState, loadState, saveRemoteState, saveState } from '../services/storage'
import { notifyAssignment } from '../services/notificationService'
import { filterTasks, sortTasks } from '../services/taskService'
import { reorderRooms } from '../services/roomService'
import { createEventFromTask, createEventFromTaskDraft, listEvents } from '../services/calendarService'
import { createId } from '../services/id'
import { roomImageOptions } from '../domain/imageCatalog'

type TaskDraft = {
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
}

interface UIState {
  activeTab: AppTab
  roomModalId: string | null
  taskModal: { open: boolean; taskId: string | null; roomId: string | null; assignee: Assignee }
  assigneeModal: Assignee
  calendarDraft: { taskId: string; data: CalendarEventDraft } | null
  dragRoomId: string | null
}

interface AppState {
  data: PersistedStateV1
  ui: UIState
}

type Action =
  | { type: 'SET_TAB'; payload: AppTab }
  | { type: 'SET_COLOR_MODE'; payload: ColorMode }
  | { type: 'SET_SORT'; payload: SortOption }
  | { type: 'SET_FILTERS'; payload: Filters }
  | { type: 'ADD_ROOM'; payload: { name: string; color: string } }
  | { type: 'DELETE_ROOM'; payload: string }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'REORDER_ROOMS'; payload: { draggedId: string; targetId: string } }
  | { type: 'OPEN_ROOM_MODAL'; payload: string | null }
  | { type: 'OPEN_TASK_MODAL'; payload: { taskId: string | null; roomId: string | null; assignee?: Assignee } }
  | { type: 'CLOSE_TASK_MODAL' }
  | { type: 'OPEN_ASSIGNEE_MODAL'; payload: Assignee }
  | { type: 'SAVE_TASK'; payload: TaskDraft }
  | { type: 'TOGGLE_TASK_DONE'; payload: string }
  | { type: 'ADD_RECURRING_PLAN'; payload: { title: string; roomId: string | null; frequencyDays: number; nextDueDate: string } }
  | { type: 'UPDATE_RECURRING_PLAN'; payload: { id: string; title: string; roomId: string | null; frequencyDays: number; nextDueDate: string } }
  | { type: 'DELETE_RECURRING_PLAN'; payload: string }
  | { type: 'SYNC_RECURRING_TASKS'; payload: { nowIso: string } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CALENDAR_DRAFT'; payload: { taskId: string; data: CalendarEventDraft } | null }
  | { type: 'UPDATE_CALENDAR_DRAFT'; payload: CalendarEventDraft }
  | { type: 'CONFIRM_CALENDAR_EVENT' }
  | { type: 'SET_DRAG_ROOM'; payload: string | null }
  | { type: 'REPLACE_DATA'; payload: PersistedStateV1 }

const makeNow = () => new Date().toISOString()
const addDaysIso = (iso: string, days: number) => {
  const date = new Date(iso)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const baseUIState: UIState = {
  activeTab: 'home',
  roomModalId: null,
  taskModal: { open: false, taskId: null, roomId: null, assignee: null },
  assigneeModal: null,
  calendarDraft: null,
  dragRoomId: null,
}

const initialState: AppState = {
  data: loadState(),
  ui: baseUIState,
}

const upsertTask = (tasks: Task[], draft: TaskDraft, fallbackId?: string | null) => {
  const now = makeNow()
  const effectiveId = draft.id ?? fallbackId ?? undefined
  if (effectiveId) {
    const index = tasks.findIndex((task) => task.id === effectiveId)
    if (index >= 0) {
      const nextTasks = [...tasks]
      nextTasks[index] = { ...nextTasks[index], ...draft, id: effectiveId, updatedAt: now }
      return nextTasks
    }
    return tasks
  }
  const task: Task = {
    id: createId('task'),
    ...draft,
    createdAt: now,
    updatedAt: now,
  }
  return [task, ...tasks]
}

const reducer = (state: AppState, action: Action): AppState => {
  if (action.type === 'SET_TAB') return { ...state, ui: { ...state.ui, activeTab: action.payload } }
  if (action.type === 'SET_COLOR_MODE') {
    return { ...state, data: { ...state.data, colorMode: action.payload } }
  }
  if (action.type === 'SET_SORT') return { ...state, data: { ...state.data, sort: action.payload } }
  if (action.type === 'SET_FILTERS') return { ...state, data: { ...state.data, filters: action.payload } }
  if (action.type === 'ADD_ROOM') {
    const image = roomImageOptions[state.data.rooms.length % roomImageOptions.length]
    const nextRoom: Room = {
      id: createId('room'),
      name: action.payload.name,
      color: action.payload.color,
      image,
      order: state.data.rooms.length,
    }
    return { ...state, data: { ...state.data, rooms: [...state.data.rooms, nextRoom] } }
  }
  if (action.type === 'DELETE_ROOM') {
    const rooms = state.data.rooms
      .filter((room) => room.id !== action.payload)
      .map((room, index) => ({ ...room, order: index }))
    const tasks = state.data.tasks.map((task) =>
      task.roomId === action.payload ? { ...task, roomId: null, updatedAt: makeNow() } : task,
    )
    return {
      ...state,
      data: { ...state.data, rooms, tasks },
      ui: {
        ...state.ui,
        roomModalId: state.ui.roomModalId === action.payload ? null : state.ui.roomModalId,
      },
    }
  }
  if (action.type === 'UPDATE_ROOM') {
    return {
      ...state,
      data: {
        ...state.data,
        rooms: state.data.rooms.map((room) => (room.id === action.payload.id ? action.payload : room)),
      },
    }
  }
  if (action.type === 'REORDER_ROOMS') {
    return {
      ...state,
      data: {
        ...state.data,
        rooms: reorderRooms(state.data.rooms, action.payload.draggedId, action.payload.targetId),
      },
    }
  }
  if (action.type === 'OPEN_ROOM_MODAL') {
    return { ...state, ui: { ...state.ui, roomModalId: action.payload } }
  }
  if (action.type === 'OPEN_TASK_MODAL') {
    return {
      ...state,
      ui: {
        ...state.ui,
        taskModal: {
          open: true,
          taskId: action.payload.taskId,
          roomId: action.payload.roomId,
          assignee: action.payload.assignee ?? null,
        },
      },
    }
  }
  if (action.type === 'CLOSE_TASK_MODAL') {
    return { ...state, ui: { ...state.ui, taskModal: { open: false, taskId: null, roomId: null, assignee: null } } }
  }
  if (action.type === 'OPEN_ASSIGNEE_MODAL') {
    return { ...state, ui: { ...state.ui, assigneeModal: action.payload } }
  }
  if (action.type === 'SAVE_TASK') {
    const editedTaskId = action.payload.id ?? state.ui.taskModal.taskId
    const previousTask = editedTaskId ? state.data.tasks.find((task) => task.id === editedTaskId) ?? null : null
    if (editedTaskId && !previousTask) {
      return {
        ...state,
        ui: { ...state.ui, taskModal: { open: false, taskId: null, roomId: null, assignee: null } },
      }
    }
    const nextTasks = upsertTask(state.data.tasks, action.payload, state.ui.taskModal.taskId)
    const updatedTask = editedTaskId ? nextTasks.find((task) => task.id === editedTaskId) ?? null : null
    let nextRoomModalId = state.ui.roomModalId
    if (
      previousTask &&
      updatedTask &&
      previousTask.roomId !== updatedTask.roomId &&
      state.ui.roomModalId === previousTask.roomId
    ) {
      nextRoomModalId = updatedTask.roomId
    }
    return {
      ...state,
      data: {
        ...state.data,
        tasks: nextTasks,
      },
      ui: { ...state.ui, roomModalId: nextRoomModalId, taskModal: { open: false, taskId: null, roomId: null, assignee: null } },
    }
  }
  if (action.type === 'TOGGLE_TASK_DONE') {
    const index = state.data.tasks.findIndex((task) => task.id === action.payload)
    if (index < 0) return state
    const nextTasks = [...state.data.tasks]
    const current = nextTasks[index]
    const nextStatus: TaskStatus = current.status === 'done' ? 'todo' : 'done'
    const nowIso = makeNow()
    nextTasks[index] = {
      ...current,
      status: nextStatus,
      updatedAt: nowIso,
    }

    let nextRecurringPlans = state.data.recurringPlans
    if (nextStatus === 'done' && nextRecurringPlans.length > 0) {
      const matchingPlan =
        nextRecurringPlans.find((plan) => plan.id === current.recurringPlanId) ??
        nextRecurringPlans.find((plan) => plan.title === current.title && plan.roomId === current.roomId) ??
        nextRecurringPlans.find((plan) => plan.title === current.title)

      if (matchingPlan) {
        const resetDueIso = addDaysIso(nowIso, Math.max(1, matchingPlan.frequencyDays))
        nextRecurringPlans = nextRecurringPlans.map((plan) =>
          plan.id === matchingPlan.id ? { ...plan, nextDueDate: resetDueIso } : plan,
        )
      }
    }

    return {
      ...state,
      data: {
        ...state.data,
        tasks: nextTasks,
        recurringPlans: nextRecurringPlans,
      },
    }
  }
  if (action.type === 'ADD_RECURRING_PLAN') {
    const now = makeNow()
    const plan: RecurringPlan = {
      id: createId('recur'),
      title: action.payload.title,
      roomId: action.payload.roomId,
      frequencyDays: Math.max(1, action.payload.frequencyDays),
      nextDueDate: action.payload.nextDueDate,
      active: true,
      createdAt: now,
    }
    return {
      ...state,
      data: { ...state.data, recurringPlans: [plan, ...state.data.recurringPlans] },
    }
  }
  if (action.type === 'UPDATE_RECURRING_PLAN') {
    return {
      ...state,
      data: {
        ...state.data,
        recurringPlans: state.data.recurringPlans.map((plan) =>
          plan.id === action.payload.id
            ? {
                ...plan,
                title: action.payload.title,
                roomId: action.payload.roomId,
                frequencyDays: Math.max(1, action.payload.frequencyDays),
                nextDueDate: action.payload.nextDueDate,
              }
            : plan,
        ),
      },
    }
  }
  if (action.type === 'DELETE_RECURRING_PLAN') {
    const nextPlans = state.data.recurringPlans.filter((plan) => plan.id !== action.payload)
    const nextTasks = state.data.tasks.filter((task) => task.recurringPlanId !== action.payload)
    return {
      ...state,
      data: {
        ...state.data,
        recurringPlans: nextPlans,
        tasks: nextTasks,
      },
    }
  }
  if (action.type === 'SYNC_RECURRING_TASKS') {
    const now = new Date(action.payload.nowIso)
    let changed = false
    const tasks = [...state.data.tasks]
    const plans = state.data.recurringPlans.map((plan) => {
      if (!plan.active) return plan
      let nextDue = new Date(plan.nextDueDate)
      let nextDueIso = plan.nextDueDate
      let iterations = 0
      while (iterations < 60) {
        const triggerDate = new Date(nextDue)
        triggerDate.setDate(triggerDate.getDate() - 7)
        if (now < triggerDate) break
        const exists = tasks.some(
          (task) => task.recurringPlanId === plan.id && task.recurringDueDate === nextDueIso,
        )
        if (!exists) {
          tasks.unshift({
            id: createId('task'),
            title: plan.title,
            description: 'Tâche récurrente automatique',
            roomId: plan.roomId,
            status: 'todo',
            priority: 'high',
            assignee: null,
            dueDate: nextDueIso.slice(0, 16),
            color: '#fb7185',
            subtasks: [],
            recurringPlanId: plan.id,
            recurringDueDate: nextDueIso,
            createdAt: action.payload.nowIso,
            updatedAt: action.payload.nowIso,
          })
          changed = true
        }
        nextDueIso = addDaysIso(nextDueIso, Math.max(1, plan.frequencyDays))
        nextDue = new Date(nextDueIso)
        changed = true
        iterations += 1
      }
      return nextDueIso !== plan.nextDueDate ? { ...plan, nextDueDate: nextDueIso } : plan
    })
    if (!changed) return state
    return {
      ...state,
      data: { ...state.data, tasks, recurringPlans: plans },
    }
  }
  if (action.type === 'DELETE_TASK') {
    const index = state.data.tasks.findIndex((task) => task.id === action.payload)
    if (index < 0) return state
    const nextTasks = [...state.data.tasks]
    nextTasks.splice(index, 1)
    return {
      ...state,
      data: {
        ...state.data,
        tasks: nextTasks,
      },
      ui: { ...state.ui, taskModal: { open: false, taskId: null, roomId: null, assignee: null } },
    }
  }
  if (action.type === 'SET_CALENDAR_DRAFT') {
    return { ...state, ui: { ...state.ui, calendarDraft: action.payload } }
  }
  if (action.type === 'UPDATE_CALENDAR_DRAFT') {
    if (!state.ui.calendarDraft) return state
    return {
      ...state,
      ui: {
        ...state.ui,
        calendarDraft: {
          ...state.ui.calendarDraft,
          data: action.payload,
        },
      },
    }
  }
  if (action.type === 'CONFIRM_CALENDAR_EVENT') {
    if (!state.ui.calendarDraft) return state
    createEventFromTask(state.ui.calendarDraft.data)
    return { ...state, ui: { ...state.ui, calendarDraft: null, activeTab: 'todo' } }
  }
  if (action.type === 'SET_DRAG_ROOM') {
    return { ...state, ui: { ...state.ui, dragRoomId: action.payload } }
  }
  if (action.type === 'REPLACE_DATA') {
    return { ...state, data: action.payload }
  }
  return state
}

interface StoreContextValue {
  state: AppState
  visibleTasks: Task[]
  sortedRooms: Room[]
  calendarEvents: ReturnType<typeof listEvents>
  setTab: (value: AppTab) => void
  setColorMode: (value: ColorMode) => void
  setSort: (value: SortOption) => void
  setFilters: (value: Filters) => void
  addRoom: (name: string, color: string) => void
  deleteRoom: (roomId: string) => void
  updateRoom: (room: Room) => void
  reorderRooms: (draggedId: string, targetId: string) => void
  openRoomModal: (roomId: string | null) => void
  openTaskModal: (taskId: string | null, roomId: string | null, assignee?: Assignee) => void
  closeTaskModal: () => void
  openAssigneeModal: (assignee: Assignee) => void
  saveTask: (draft: TaskDraft) => void
  toggleTaskDone: (taskId: string) => void
  addRecurringPlan: (payload: { title: string; roomId: string | null; frequencyDays: number; nextDueDate: string }) => void
  updateRecurringPlan: (payload: { id: string; title: string; roomId: string | null; frequencyDays: number; nextDueDate: string }) => void
  deleteRecurringPlan: (planId: string) => void
  syncRecurringTasks: () => void
  deleteTask: (taskId: string) => void
  openCalendarDraft: (taskId: string) => void
  updateCalendarDraft: (draft: CalendarEventDraft) => void
  confirmCalendarEvent: () => void
  closeCalendarDraft: () => void
  setDragRoom: (roomId: string | null) => void
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

export const AppStoreProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydratedFromRemote, setHydratedFromRemote] = useState(false)

  useEffect(() => {
    let active = true
    const hydrate = async () => {
      const remote = await loadRemoteState()
      if (!active) return
      if (remote) {
        dispatch({ type: 'REPLACE_DATA', payload: remote })
      }
      setHydratedFromRemote(true)
    }
    void hydrate()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!hydratedFromRemote) return
    // Keep local as safety backup, remote is now the source of truth across devices.
    saveState(state.data)
    void saveRemoteState(state.data)
  }, [hydratedFromRemote, state.data])

  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(state.data.tasks, state.data.filters), state.data.sort),
    [state.data.tasks, state.data.filters, state.data.sort],
  )

  const sortedRooms = useMemo(
    () => [...state.data.rooms].sort((a, b) => a.order - b.order),
    [state.data.rooms],
  )

  const value = useMemo<StoreContextValue>(() => {
    const openCalendarDraft = (taskId: string) => {
      const task = state.data.tasks.find((item) => item.id === taskId)
      if (!task) return
      const roomName = state.data.rooms.find((room) => room.id === task.roomId)?.name ?? null
      dispatch({
        type: 'SET_CALENDAR_DRAFT',
        payload: {
          taskId,
          data: createEventFromTaskDraft(task, roomName),
        },
      })
    }

    return {
      state,
      visibleTasks,
      sortedRooms,
      calendarEvents: listEvents(),
      setTab: (value) => dispatch({ type: 'SET_TAB', payload: value }),
      setColorMode: (value) => dispatch({ type: 'SET_COLOR_MODE', payload: value }),
      setSort: (value) => dispatch({ type: 'SET_SORT', payload: value }),
      setFilters: (value) => dispatch({ type: 'SET_FILTERS', payload: value }),
      addRoom: (name, color) => dispatch({ type: 'ADD_ROOM', payload: { name, color } }),
      deleteRoom: (roomId) => dispatch({ type: 'DELETE_ROOM', payload: roomId }),
      updateRoom: (room) => dispatch({ type: 'UPDATE_ROOM', payload: room }),
      reorderRooms: (draggedId, targetId) =>
        dispatch({ type: 'REORDER_ROOMS', payload: { draggedId, targetId } }),
      openRoomModal: (roomId) => dispatch({ type: 'OPEN_ROOM_MODAL', payload: roomId }),
      openTaskModal: (taskId, roomId, assignee) =>
        dispatch({ type: 'OPEN_TASK_MODAL', payload: { taskId, roomId, assignee } }),
      closeTaskModal: () => dispatch({ type: 'CLOSE_TASK_MODAL' }),
      openAssigneeModal: (assignee) => dispatch({ type: 'OPEN_ASSIGNEE_MODAL', payload: assignee }),
      saveTask: (draft) => {
        const editedTaskId = draft.id ?? state.ui.taskModal.taskId
        const previousTask = editedTaskId
          ? state.data.tasks.find((t) => t.id === editedTaskId) ?? null
          : null
        const previousAssignee = previousTask?.assignee ?? null
        if (draft.assignee && draft.assignee !== previousAssignee) {
          void notifyAssignment(draft.title, draft.assignee)
        }
        dispatch({ type: 'SAVE_TASK', payload: draft })
      },
      toggleTaskDone: (taskId) => dispatch({ type: 'TOGGLE_TASK_DONE', payload: taskId }),
      addRecurringPlan: (payload) => dispatch({ type: 'ADD_RECURRING_PLAN', payload }),
      updateRecurringPlan: (payload) => dispatch({ type: 'UPDATE_RECURRING_PLAN', payload }),
      deleteRecurringPlan: (planId) => dispatch({ type: 'DELETE_RECURRING_PLAN', payload: planId }),
      syncRecurringTasks: () => dispatch({ type: 'SYNC_RECURRING_TASKS', payload: { nowIso: makeNow() } }),
      deleteTask: (taskId) => dispatch({ type: 'DELETE_TASK', payload: taskId }),
      openCalendarDraft,
      updateCalendarDraft: (draft) => dispatch({ type: 'UPDATE_CALENDAR_DRAFT', payload: draft }),
      confirmCalendarEvent: () => dispatch({ type: 'CONFIRM_CALENDAR_EVENT' }),
      closeCalendarDraft: () => dispatch({ type: 'SET_CALENDAR_DRAFT', payload: null }),
      setDragRoom: (roomId) => dispatch({ type: 'SET_DRAG_ROOM', payload: roomId }),
    }
  }, [state, visibleTasks, sortedRooms])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useAppStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider')
  }
  return context
}
