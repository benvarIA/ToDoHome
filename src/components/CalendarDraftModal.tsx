import { listCalendars } from '../services/calendarService'
import type { CalendarEventDraft } from '../domain/types'
import { Modal } from './Modal'

interface CalendarDraftModalProps {
  draft: CalendarEventDraft | null
  open: boolean
  image: string
  onChange: (draft: CalendarEventDraft) => void
  onClose: () => void
  onConfirm: () => void
}

export const CalendarDraftModal = ({
  draft,
  open,
  image,
  onChange,
  onClose,
  onConfirm,
}: CalendarDraftModalProps) => {
  return (
    <Modal open={open} title="Créer un événement agenda" onClose={onClose}>
      {draft ? (
        <div className="modal-form">
          <img className="modal-illustration" src={image} alt="Illustration calendrier" />
          <label>
            Calendrier
            <select
              className="select"
              value={draft.calendarId}
              onChange={(event) => onChange({ ...draft, calendarId: event.target.value })}
            >
              {listCalendars().map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Titre
            <input
              className="input"
              value={draft.title}
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              className="textarea"
              rows={3}
              value={draft.description}
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              Début
              <input
                className="input"
                type="datetime-local"
                value={draft.start}
                onChange={(event) => onChange({ ...draft, start: event.target.value })}
              />
            </label>
            <label>
              Fin
              <input
                className="input"
                type="datetime-local"
                value={draft.end}
                onChange={(event) => onChange({ ...draft, end: event.target.value })}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn" type="button" onClick={onConfirm}>
              Créer l’événement
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
