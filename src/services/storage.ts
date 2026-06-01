import { defaultFilters, defaultRooms, defaultTasks } from '../domain/defaultData'
import type { PersistedStateV1 } from '../domain/types'
import { roomImageForName } from '../domain/imageCatalog'
import { createId } from './id'

const STORAGE_KEY = 'todohome_state'
const normalizeRoomName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const baseState = (): PersistedStateV1 => ({
  version: 1,
  colorMode: 'room',
  sort: 'recent',
  filters: defaultFilters,
  rooms: defaultRooms,
  tasks: defaultTasks,
  recurringPlans: [],
})

const isV1 = (data: unknown): data is PersistedStateV1 => {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Partial<PersistedStateV1>
  return candidate.version === 1 && Array.isArray(candidate.rooms) && Array.isArray(candidate.tasks)
}

const normalizeState = (parsed: PersistedStateV1): PersistedStateV1 => {
  let normalizedRooms = parsed.rooms.map((room) => ({
    ...room,
    image: room.image || roomImageForName(room.name),
  }))
  let normalizedTasks = parsed.tasks.map((task) =>
    task.id ? task : { ...task, id: createId('task') }
  )
  if (normalizedRooms.length === 0) {
    normalizedRooms = defaultRooms.map((room, index) => ({ ...room, order: index }))
  }
  const balconDefault = defaultRooms.find((room) => room.id === 'room-balcony')
  if (balconDefault) {
    const balconIds = normalizedRooms
      .filter((room) => room.id === balconDefault.id || normalizeRoomName(room.name) === 'balcon')
      .map((room) => room.id)

    const hasCanonicalBalcony = normalizedRooms.some((room) => room.id === balconDefault.id)
    if (!hasCanonicalBalcony) {
      normalizedRooms = [...normalizedRooms, { ...balconDefault, order: normalizedRooms.length }]
    }

    const balconyIdSet = new Set(
      normalizedRooms
        .filter((room) => room.id === balconDefault.id || normalizeRoomName(room.name) === 'balcon')
        .map((room) => room.id),
    )
    balconyIdSet.delete(balconDefault.id)
    const duplicateBalconyIds = [...balconyIdSet]

    if (duplicateBalconyIds.length > 0) {
      const duplicateSet = new Set(duplicateBalconyIds)
      normalizedRooms = normalizedRooms.filter((room) => !duplicateSet.has(room.id))
      normalizedTasks = normalizedTasks.map((task) =>
        task.roomId && duplicateSet.has(task.roomId) ? { ...task, roomId: balconDefault.id } : task,
      )
    }

    const canonicalIndex = normalizedRooms.findIndex((room) => room.id === balconDefault.id)
    if (canonicalIndex >= 0) {
      normalizedRooms[canonicalIndex] = {
        ...normalizedRooms[canonicalIndex],
        name: balconDefault.name,
        image: balconDefault.image,
      }
    } else if (balconIds.length > 0) {
      normalizedTasks = normalizedTasks.map((task) =>
        task.roomId && balconIds.includes(task.roomId) ? { ...task, roomId: null } : task,
      )
    }
  }
  const normalizedNames = new Set(normalizedRooms.map((room) => normalizeRoomName(room.name)))
  for (const room of defaultRooms) {
    if (normalizedRooms.some((item) => item.id === room.id)) continue
    if (normalizedNames.has(normalizeRoomName(room.name))) continue
    normalizedRooms.push({ ...room, order: normalizedRooms.length })
  }
  const validRoomIds = new Set(normalizedRooms.map((room) => room.id))
  normalizedTasks = normalizedTasks.map((task) =>
    task.roomId && !validRoomIds.has(task.roomId) ? { ...task, roomId: null } : task,
  )
  normalizedRooms = normalizedRooms.map((room, index) => ({ ...room, order: index }))
  return {
    ...baseState(),
    ...parsed,
    rooms: normalizedRooms,
    tasks: normalizedTasks,
    recurringPlans: Array.isArray(parsed.recurringPlans) ? parsed.recurringPlans : [],
    filters: { ...baseState().filters, ...parsed.filters },
  }
}

export const loadState = (): PersistedStateV1 => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return baseState()
    const parsed = JSON.parse(raw) as unknown
    if (isV1(parsed)) {
      return normalizeState(parsed)
    }
    return baseState()
  } catch {
    return baseState()
  }
}

export const saveState = (state: PersistedStateV1) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const loadRemoteState = async (): Promise<PersistedStateV1 | null> => {
  try {
    const response = await fetch('/api/state', { method: 'GET' })
    if (!response.ok) return null
    const payload = (await response.json()) as { state?: unknown }
    if (!payload?.state) return null
    if (!isV1(payload.state)) return null
    return normalizeState(payload.state)
  } catch {
    return null
  }
}

export const saveRemoteState = async (state: PersistedStateV1) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
  } catch {
    // no-op: local UI stays usable even if remote save fails temporarily
  }
}
