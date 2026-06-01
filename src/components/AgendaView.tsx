import { listCalendars } from '../services/calendarService'
import type { CalendarEvent } from '../domain/types'

interface AgendaViewProps {
  events: CalendarEvent[]
  heroImage: string
  sideImage: string
  planningImage: string
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const AgendaView = ({ events, heroImage, sideImage, planningImage }: AgendaViewProps) => {
  const calendars = listCalendars()
  return (
    <section className="agenda">
      <header className="section-head">
        <img className="agenda-hero" src={heroImage} alt="Illustration agenda" />
        <h2>Agenda</h2>
        <p>Version mock V1 avec deux calendriers, prête pour branchement Google Calendar.</p>
      </header>
      <div className="agenda-grid">
        {calendars.map((calendar) => {
          const calendarEvents = events.filter((event) => event.calendarId === calendar.id)
          return (
            <article key={calendar.id} className="agenda-card">
              <img
                className="agenda-card__image"
                src={calendar.owner === 'me' ? sideImage : planningImage}
                alt={`Illustration ${calendar.name}`}
                loading="lazy"
              />
              <h3>{calendar.name}</h3>
              {calendarEvents.length === 0 ? <p className="empty">Aucun événement pour le moment.</p> : null}
              <div className="agenda-items">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="agenda-item">
                    <strong>{event.title}</strong>
                    <p>{event.description}</p>
                    <small>
                      {formatDate(event.start)} → {formatDate(event.end)}
                    </small>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
