import type { Calendar, Filters, Room, Task } from './types'

const now = new Date()

const isoPlusDays = (days: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 16)
}

export const defaultRooms: Room[] = [
  { id: 'room-kitchen', name: 'Cuisine', color: '#f59e0b', image: '/custom-images/cuisine.png', order: 0 },
  { id: 'room-living', name: 'Salon', color: '#22c55e', image: '/custom-images/salon.png', order: 1 },
  { id: 'room-bath', name: 'Salle de bain', color: '#38bdf8', image: '/custom-images/sdb.png', order: 2 },
  { id: 'room-bedroom', name: 'Chambre Parents', color: '#a78bfa', image: '/custom-images/chambreparent.png', order: 3 },
  { id: 'room-child', name: 'Chambre Enfant', color: '#f97316', image: '/custom-images/chambrepierre.png', order: 4 },
  { id: 'room-hall', name: 'Couloir', color: '#9333ea', image: '/custom-images/couloir.png', order: 5 },
  { id: 'room-cellar', name: 'Cave', color: '#7c3aed', image: '/custom-images/cave.png', order: 6 },
  { id: 'room-balcony', name: 'Balcon', color: '#84cc16', image: '/custom-images/balcon.png', order: 7 },
]

export const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Lancer une machine',
    description: 'Trier les couleurs puis lancer un cycle rapide.',
    roomId: null,
    status: 'todo',
    priority: 'normal',
    assignee: 'me',
    dueDate: isoPlusDays(1),
    color: '#ffb27f',
    subtasks: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'task-2',
    title: 'Nettoyer le plan de travail',
    description: '',
    roomId: 'room-kitchen',
    status: 'in_progress',
    priority: 'high',
    assignee: 'wife',
    dueDate: isoPlusDays(0),
    color: '#ffd166',
    subtasks: [
      { id: 'sub-21', label: 'Ranger les ustensiles', done: true },
      { id: 'sub-22', label: 'Désinfecter la surface', done: false },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'task-3',
    title: 'Aspirateur',
    description: '',
    roomId: 'room-living',
    status: 'todo',
    priority: 'normal',
    assignee: null,
    dueDate: isoPlusDays(2),
    color: '#8be9fd',
    subtasks: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
]

export const defaultFilters: Filters = {
  search: '',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  due: 'all',
}

export const mockCalendars: Calendar[] = [
  { id: 'cal-me', name: 'Agenda Moi', owner: 'me' },
  { id: 'cal-wife', name: 'Agenda Femme', owner: 'wife' },
]
