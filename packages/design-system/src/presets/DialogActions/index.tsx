import type { ReactNode } from 'react'
import { Button } from '../../components/button'
import { Spinner } from '../../components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/tooltip'
import { cn } from '../../utils/cn'

/**
 * Wraps the confirm button in a host-supplied gate that decides whether it is enabled.
 * The design system deliberately knows nothing about wallets or chains — the app passes
 * its own gate (see `apps/web/src/components/common/DialogActions`, which supplies
 * `<CheckWallet>`), and the footer keeps owning order, variants, sizes and layout.
 */
export type ConfirmGate = (renderConfirm: (enabled: boolean) => ReactNode) => ReactNode

type DialogActionsProps = {
  /** Confirm/primary button label (swaps to a spinner while `confirmLoading`). */
  confirmLabel: ReactNode
  onConfirm?: () => void
  /** Use `"submit"` when the confirm button submits a surrounding `<form>`. */
  confirmType?: 'button' | 'submit'
  /** `form` id when the confirm button submits a form it is not nested in. */
  confirmForm?: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
  /** Render the confirm as a destructive action (Delete/Remove). */
  confirmDestructive?: boolean
  confirmTestId?: string
  /**
   * Gate the confirm behind a host-supplied check, which renders it disabled (usually with
   * an explanatory tooltip) when the action is not currently allowed. In the web app this
   * is `<CheckWallet>` — reach for `@/components/common/DialogActions`, which wires it up
   * behind a `confirmCheckWallet` prop, rather than passing a gate by hand.
   */
  confirmGate?: ConfirmGate
  /** Explanatory tooltip on the confirm button (e.g. why it is disabled). Independent of wallet state. */
  confirmTooltip?: ReactNode
  /** Omit `onCancel` to render a confirm-only footer. */
  onCancel?: () => void
  cancelLabel?: string
  cancelDisabled?: boolean
  cancelTestId?: string
  /** Layout only (e.g. padding to match the dialog). */
  className?: string
}

/**
 * DialogActions — the canonical dialog footer buttons.
 *
 * Owns the button order, variants, sizes and responsive layout so every dialog
 * footer looks and behaves the same: Cancel is `variant="outline"`, Confirm is
 * `default` (or `destructive`), both `size="submit"`. On mobile they stack with
 * the confirm on top; on desktop they sit in a right-aligned row. Reach for this
 * instead of hand-building a Cancel/Confirm row.
 *
 * Set `confirmGate` to gate the confirm on a host condition, and `confirmTooltip` to
 * explain a disabled confirm for reasons the gate does not cover.
 */
const DialogActions = ({
  confirmLabel,
  onConfirm,
  confirmType = 'button',
  confirmForm,
  confirmDisabled = false,
  confirmLoading = false,
  confirmDestructive = false,
  confirmTestId,
  confirmGate,
  confirmTooltip,
  onCancel,
  cancelLabel = 'Cancel',
  cancelDisabled = false,
  cancelTestId,
  className,
}: DialogActionsProps) => {
  const renderConfirm = (enabled = true) => (
    <Button
      variant={confirmDestructive ? 'destructive' : 'default'}
      size="submit"
      type={confirmType}
      form={confirmForm}
      onClick={onConfirm}
      disabled={confirmDisabled || confirmLoading || !enabled}
      data-testid={confirmTestId}
    >
      {confirmLoading ? <Spinner /> : confirmLabel}
    </Button>
  )

  let confirmButton = confirmGate ? confirmGate(renderConfirm) : renderConfirm()

  if (confirmTooltip) {
    confirmButton = (
      <Tooltip>
        <TooltipTrigger render={<div className="inline-flex" />}>{confirmButton}</TooltipTrigger>
        <TooltipContent>{confirmTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="submit"
          onClick={onCancel}
          disabled={cancelDisabled || confirmLoading}
          data-testid={cancelTestId}
        >
          {cancelLabel}
        </Button>
      )}
      {confirmButton}
    </div>
  )
}

export default DialogActions
