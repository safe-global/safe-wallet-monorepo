import { type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

import css from './styles.module.css'

/** MUI Dialog `maxWidth` breakpoint keys that map 1:1 onto the DialogContent `size` scale. */
const SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const
type SizeKey = (typeof SIZE_KEYS)[number]
const isSizeKey = (value: unknown): value is SizeKey =>
  typeof value === 'string' && (SIZE_KEYS as readonly string[]).includes(value)

export type ModalDialogTitleViewProps = {
  children: ReactNode
  onClose?: () => void
  chainIndicator?: ReactNode
  titleClassName?: string
}

export const ModalDialogTitleView = ({
  children,
  onClose,
  chainIndicator,
  titleClassName,
  ...other
}: ModalDialogTitleViewProps) => {
  return (
    <h2
      data-testid="modal-title"
      className={cn(
        'text-foreground m-0 flex items-center px-6 pt-6 pb-4 text-lg font-bold',
        css.title,
        titleClassName,
      )}
      {...other}
    >
      {children}
      <span className="flex-1" />
      {chainIndicator}
      {onClose ? (
        <Button
          data-testid="modal-dialog-close-btn"
          aria-label="close"
          variant="ghost"
          size="icon-sm"
          onClick={() => onClose()}
          className="ml-4 text-[var(--color-border-main)]"
        >
          <X />
        </Button>
      ) : null}
    </h2>
  )
}

export type ModalDialogViewProps = {
  open?: boolean
  onClose?: () => void
  title?: ReactNode
  isFullScreen: boolean
  children?: ReactNode
  dialogClassName?: string
  dialogOverlayClassName?: string
  forceBackdrop: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string | false
  paperMaxWidth?: number | string
  keepMounted?: boolean
  testId: string
}

export function ModalDialogView({
  open,
  onClose,
  title,
  isFullScreen,
  children,
  dialogClassName,
  dialogOverlayClassName,
  forceBackdrop,
  maxWidth,
  paperMaxWidth,
  keepMounted,
  testId,
}: ModalDialogViewProps): ReactElement {
  // Breakpoint keys map onto the DialogContent `size` scale (class-based); arbitrary
  // numeric/CSS widths (and PaperProps overrides) still need an inline max-width.
  const size = isSizeKey(maxWidth) ? maxWidth : undefined
  const inlineMaxWidth =
    paperMaxWidth ?? (size == null && maxWidth !== false && maxWidth != null ? maxWidth : undefined)

  // fullScreen positioning must beat DialogContent's centered base classes, so apply it inline.
  const fullScreenStyle = isFullScreen
    ? {
        top: 0,
        left: 0,
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        transform: 'none',
        translate: 'none',
      }
    : undefined

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      {forceBackdrop && (
        <DialogPortal keepMounted={keepMounted}>
          <DialogOverlay forceRender className={dialogOverlayClassName} />
        </DialogPortal>
      )}

      <DialogContent
        data-testid={testId}
        showCloseButton={false}
        keepMounted={keepMounted}
        size={size}
        className={cn(
          css.dialog,
          { [css.fullScreen]: isFullScreen },
          isFullScreen && 'translate-x-0 translate-y-0',
          dialogClassName,
        )}
        overlayClassName={forceBackdrop ? 'hidden' : dialogOverlayClassName}
        style={{ ...(inlineMaxWidth != null ? { maxWidth: inlineMaxWidth } : {}), ...fullScreenStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {title}

        {children}
      </DialogContent>
    </Dialog>
  )
}
