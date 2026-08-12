import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import CheckWallet, { type CheckWalletProps } from '@/components/common/CheckWallet'
import { cn } from '@/utils/cn'

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
   * Gate the confirm behind `<CheckWallet>`: it becomes disabled (with an explanatory
   * tooltip) whenever the connected wallet cannot perform the action. Pass `true` for the
   * defaults, or an object of CheckWallet options (e.g. `{ checkNetwork: true, allowProposer: false }`).
   */
  confirmCheckWallet?: boolean | Omit<CheckWalletProps, 'children'>
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
 * Set `confirmCheckWallet` to gate the confirm on the connected wallet, and
 * `confirmTooltip` to explain a disabled confirm for non-wallet reasons.
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
  confirmCheckWallet,
  confirmTooltip,
  onCancel,
  cancelLabel = 'Cancel',
  cancelDisabled = false,
  cancelTestId,
  className,
}: DialogActionsProps) => {
  const renderConfirm = (walletOk = true) => (
    <Button
      variant={confirmDestructive ? 'destructive' : 'default'}
      size="submit"
      type={confirmType}
      form={confirmForm}
      onClick={onConfirm}
      disabled={confirmDisabled || confirmLoading || !walletOk}
      data-testid={confirmTestId}
    >
      {confirmLoading ? <Spinner /> : confirmLabel}
    </Button>
  )

  let confirmButton = confirmCheckWallet ? (
    <CheckWallet {...(confirmCheckWallet === true ? {} : confirmCheckWallet)}>
      {(isOk) => renderConfirm(isOk)}
    </CheckWallet>
  ) : (
    renderConfirm()
  )

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
