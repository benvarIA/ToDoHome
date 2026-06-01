import { useRef } from 'react'
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'

interface ModalProps extends PropsWithChildren {
  open: boolean
  title: string
  onClose: () => void
  className?: string
  bodyClassName?: string
  style?: CSSProperties
  closeIconOnly?: boolean
  headerActions?: ReactNode
}

export const Modal = ({
  open,
  title,
  onClose,
  children,
  className,
  bodyClassName,
  style,
  closeIconOnly = false,
  headerActions,
}: ModalProps) => {
  const shouldCloseOnClickRef = useRef(false)

  if (!open) return null
  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(event) => {
        shouldCloseOnClickRef.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        const isBackdropClick = event.target === event.currentTarget
        if (isBackdropClick && shouldCloseOnClickRef.current) onClose()
        shouldCloseOnClickRef.current = false
      }}
    >
      <div
        className={`modal ${className ?? ''}`.trim()}
        style={style}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <div className="modal__header-actions">
            {headerActions}
            <button className="btn btn--ghost btn--close" onClick={onClose} type="button" aria-label="Fermer">
              {closeIconOnly ? '×' : 'Fermer'}
            </button>
          </div>
        </header>
        <div className={`modal__body ${bodyClassName ?? ''}`.trim()}>{children}</div>
      </div>
    </div>
  )
}
