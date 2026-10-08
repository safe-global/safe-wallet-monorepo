import { type ReactElement, type ReactNode } from 'react'
import { useIsBelowSm } from '@/hooks/useMediaQuery'
import ChainIndicator from '@/components/common/ChainIndicator'
import { ModalDialogTitleView, ModalDialogView } from '@views/components/common/ModalDialog/ModalDialogView'

interface ModalDialogProps {
  open?: boolean
  onClose?: () => void
  dialogTitle?: ReactNode
  hideChainIndicator?: boolean
  chainId?: string
  fullScreen?: boolean
  children?: ReactNode
  className?: string
  /** Applied to the backdrop — needed when the dialog has to out-stack a third-party overlay. */
  overlayClassName?: string
  /** Renders the backdrop even when nested in another dialog — needed inside the (backdrop-less) tx-flow modal. */
  forceBackdrop?: boolean
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
    <ModalDialogTitleView
      onClose={onClose}
      chainIndicator={!hideChainIndicator && <ChainIndicator chainId={chainId} inline />}
      titleClassName={className}
      {...other}
    >
      {children}
    </ModalDialogTitleView>
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
  overlayClassName,
  forceBackdrop = false,
  maxWidth,
  PaperProps,
  keepMounted,
  'data-testid': dataTestid = 'modal-view',
}: ModalDialogProps): ReactElement => {
  const isSmallScreen = useIsBelowSm()
  const isFullScreen = fullScreen || isSmallScreen

  return (
    <ModalDialogView
      open={open}
      onClose={onClose}
      title={
        dialogTitle && (
          <ModalDialogTitle onClose={onClose} hideChainIndicator={hideChainIndicator} chainId={chainId}>
            {dialogTitle}
          </ModalDialogTitle>
        )
      }
      isFullScreen={isFullScreen}
      dialogClassName={className}
      dialogOverlayClassName={overlayClassName}
      forceBackdrop={forceBackdrop}
      maxWidth={maxWidth}
      paperMaxWidth={PaperProps?.sx?.maxWidth}
      keepMounted={keepMounted}
      testId={dataTestid}
    >
      {children}
    </ModalDialogView>
  )
}

export default ModalDialog
