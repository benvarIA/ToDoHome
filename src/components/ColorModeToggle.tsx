import type { ColorMode } from '../domain/types'

interface ColorModeToggleProps {
  mode: ColorMode
  onChange: (mode: ColorMode) => void
}

export const ColorModeToggle = ({ mode, onChange }: ColorModeToggleProps) => {
  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`pill ${mode === 'room' ? 'pill--active' : ''}`}
        onClick={() => onChange('room')}
      >
        Couleur par pièce
      </button>
      <button
        type="button"
        className={`pill ${mode === 'assignee' ? 'pill--active' : ''}`}
        onClick={() => onChange('assignee')}
      >
        Couleur par assigné
      </button>
      <button
        type="button"
        className={`pill ${mode === 'priority' ? 'pill--active' : ''}`}
        onClick={() => onChange('priority')}
      >
        Couleur par priorité
      </button>
    </div>
  )
}
