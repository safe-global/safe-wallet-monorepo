import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import classnames from 'classnames'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
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

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Popup
          className={classnames(css.dialog, css.paper, { [css.fullWidth]: fullWidth })}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={css.title}>
            <div className={css.buttons}>
              <button type="button" className={css.close} aria-label="close" onClick={() => onClose?.()}>
                <X className="size-6" />
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
