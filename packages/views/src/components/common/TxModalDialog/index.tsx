import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import classnames from 'classnames'
import { useRef, type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { usePortalContainer } from '@safe-global/views/components/ui/ShadcnProvider'
import css from './styles.module.css'

type TxModalDialogProps = {
  children?: ReactNode
  open?: boolean
  onClose?: () => void
  fullScreen?: boolean
  fullWidth?: boolean
}

const TxModalDialog = ({ children, open, onClose, fullWidth = false }: TxModalDialogProps): ReactElement => {
  const portalContainer = usePortalContainer()
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Popup
          ref={popupRef}
          // A flow marks the control a user starts with; otherwise the dialog's own first focus applies
          initialFocus={() => popupRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? true}
          className={classnames(css.dialog, css.paper, { [css.fullWidth]: fullWidth })}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={css.title}>
            <div className={css.buttons}>
              <button type="button" className={css.close} aria-label="close" onClick={() => onClose?.()}>
                <X />
              </button>
            </div>
          </div>
          <div className={css.content}>
            <div tabIndex={-1} className="text-[var(--color-text-primary)]">
              {children}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default TxModalDialog
