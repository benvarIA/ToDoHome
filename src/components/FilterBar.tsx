import type { Assignee, Filters, Priority, SortOption, TaskStatus } from '../domain/types'

interface FilterBarProps {
  filters: Filters
  sort: SortOption
  onChange: (filters: Filters) => void
  onSortChange: (sort: SortOption) => void
}

const statuses: Array<Filters['status']> = ['all', 'todo', 'in_progress', 'done']
const priorities: Array<Filters['priority']> = ['all', 'low', 'normal', 'high']
const assignees: Array<Filters['assignee']> = ['all', 'me', 'wife', null]
const dueOptions: Array<Filters['due']> = ['all', 'today', 'week', 'overdue']

const labelMap: Record<string, string> = {
  all: 'Tous',
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Fait',
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  me: 'Moi',
  wife: 'Femme',
  today: 'Aujourd’hui',
  week: '7 jours',
  overdue: 'En retard',
  null: 'Non assignée',
  priority: 'Priorité',
  due: 'Échéance',
  recent: 'Récent',
  alpha: 'A-Z',
}

const parseStatus = (value: string): Filters['status'] => value as TaskStatus | 'all'
const parsePriority = (value: string): Filters['priority'] => value as Priority | 'all'
const parseAssignee = (value: string): Filters['assignee'] => (value === 'null' ? null : (value as Assignee | 'all'))

export const FilterBar = ({ filters, sort, onChange, onSortChange }: FilterBarProps) => {
  return (
    <section className="filter-bar">
      <input
        className="input"
        value={filters.search}
        placeholder="Rechercher une tâche..."
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
      />
      <select
        className="select"
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: parseStatus(event.target.value) })}
      >
        {statuses.map((item) => (
          <option key={String(item)} value={String(item)}>
            {labelMap[String(item)]}
          </option>
        ))}
      </select>
      <select
        className="select"
        value={filters.priority}
        onChange={(event) => onChange({ ...filters, priority: parsePriority(event.target.value) })}
      >
        {priorities.map((item) => (
          <option key={String(item)} value={String(item)}>
            {labelMap[String(item)]}
          </option>
        ))}
      </select>
      <select
        className="select"
        value={String(filters.assignee)}
        onChange={(event) => onChange({ ...filters, assignee: parseAssignee(event.target.value) })}
      >
        {assignees.map((item) => (
          <option key={String(item)} value={String(item)}>
            {labelMap[String(item)]}
          </option>
        ))}
      </select>
      <select
        className="select"
        value={filters.due}
        onChange={(event) => onChange({ ...filters, due: event.target.value as Filters['due'] })}
      >
        {dueOptions.map((item) => (
          <option key={item} value={item}>
            {labelMap[item]}
          </option>
        ))}
      </select>
      <select className="select" value={sort} onChange={(event) => onSortChange(event.target.value as SortOption)}>
        <option value="recent">{labelMap.recent}</option>
        <option value="priority">{labelMap.priority}</option>
        <option value="due">{labelMap.due}</option>
        <option value="alpha">{labelMap.alpha}</option>
      </select>
    </section>
  )
}
