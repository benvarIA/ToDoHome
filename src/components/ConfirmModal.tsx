import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="confirm-modal">
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn--danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
