import { type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/utils/cn'
import ChainIndicator from '@/components/common/ChainIndicator'

import css from './styles.module.css'

/** MUI Dialog `maxWidth` breakpoint keys that map 1:1 onto the DialogContent `size` scale. */
const SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const
type SizeKey = (typeof SIZE_KEYS)[number]
const isSizeKey = (value: unknown): value is SizeKey =>
  typeof value === 'string' && (SIZE_KEYS as readonly string[]).includes(value)

interface ModalDialogProps {
  open?: boolean
  onClose?: () => void
  dialogTitle?: ReactNode
  hideChainIndicator?: boolean
  chainId?: string
  fullScreen?: boolean
  children?: ReactNode
  className?: string
  /** MUI breakpoint key (e.g. `'sm'`) or a CSS width — applied as the popup's max-width. */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string | false
  /** @deprecated MUI `fullWidth` is a no-op after the shadcn migration; popups are full-width up to `maxWidth`. */
  fullWidth?: boolean
  /** Keeps the dialog content mounted while closed (forwarded to the Base UI portal). */
  keepMounted?: boolean
  /** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
  sx?: object
  /** @deprecated MUI `slotProps` is ignored after the shadcn migration; use `className`/`maxWidth` instead. */
  slotProps?: object
  /** @deprecated MUI `PaperProps` is ignored after the shadcn migration; only `sx.maxWidth` is honored via the popup style. */
  PaperProps?: { sx?: { maxWidth?: number | string } }
  'data-testid'?: string
}

interface DialogTitleProps {
  children: ReactNode
  onClose?: () => void
  hideChainIndicator?: boolean
  chainId?: string
  className?: string
  /** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
  sx?: object
}

export const ModalDialogTitle = ({
  children,
  onClose,
  hideChainIndicator = false,
  chainId,
  className,
  sx: _sx,
  ...other
}: DialogTitleProps) => {
  return (
    <h2
      data-testid="modal-title"
      className={cn('text-foreground m-0 flex items-center px-6 pt-6 pb-4 text-lg font-bold', css.title, className)}
      {...other}
    >
      {children}
      <span className="flex-1" />
      {!hideChainIndicator && <ChainIndicator chainId={chainId} inline />}
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

const ModalDialog = ({
  open,
  onClose,
  dialogTitle,
  hideChainIndicator,
  children,
  fullScreen = false,
  chainId,
  className,
  maxWidth,
  PaperProps,
  keepMounted,
  'data-testid': dataTestid = 'modal-view',
}: ModalDialogProps): ReactElement => {
  const isSmallScreen = useIsMobile()
  const isFullScreen = fullScreen || isSmallScreen

  // Breakpoint keys map onto the DialogContent `size` scale (class-based); arbitrary
  // numeric/CSS widths (and PaperProps overrides) still need an inline max-width.
  const size = isSizeKey(maxWidth) ? maxWidth : undefined
  const inlineMaxWidth =
    PaperProps?.sx?.maxWidth ?? (size == null && maxWidth !== false && maxWidth != null ? maxWidth : undefined)

  // fullScreen positioning must beat DialogContent's centered base classes, so apply it inline.
  const fullScreenStyle = isFullScreen
    ? { top: 0, left: 0, maxWidth: '100%', width: '100%', height: '100%', maxHeight: '100%', transform: 'none' }
    : undefined

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      <DialogContent
        data-testid={dataTestid}
        showCloseButton={false}
        keepMounted={keepMounted}
        size={size}
        className={cn(css.dialog, { [css.fullScreen]: isFullScreen }, className)}
        style={{ ...(inlineMaxWidth != null ? { maxWidth: inlineMaxWidth } : {}), ...fullScreenStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {dialogTitle && (
          <ModalDialogTitle onClose={onClose} hideChainIndicator={hideChainIndicator} chainId={chainId}>
            {dialogTitle}
          </ModalDialogTitle>
        )}

        {children}
      </DialogContent>
    </Dialog>
  )
}

export default ModalDialog
