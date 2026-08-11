import type { ComponentProps } from 'react'
import BaseDialogActions from '@safe-global/design-system/presets/DialogActions'
import CheckWallet, { type CheckWalletProps } from '@/components/common/CheckWallet'

type BaseProps = Omit<ComponentProps<typeof BaseDialogActions>, 'confirmGate'>

type DialogActionsProps = BaseProps & {
  /**
   * Gate the confirm behind `<CheckWallet>`: it becomes disabled (with an explanatory
   * tooltip) whenever the connected wallet cannot perform the action. Pass `true` for the
   * defaults, or an object of CheckWallet options (e.g. `{ checkNetwork: true, allowProposer: false }`).
   */
  confirmCheckWallet?: boolean | Omit<CheckWalletProps, 'children'>
}

/**
 * The app's DialogActions — the design-system footer plus this app's wallet gate.
 *
 * The layout, button order, variants and sizes live in
 * `@safe-global/design-system/presets/DialogActions`, which knows nothing about wallets.
 * This wrapper supplies the Safe-specific `<CheckWallet>` gate so call sites keep passing
 * `confirmCheckWallet` and never have to wire a gate by hand.
 */
const DialogActions = ({ confirmCheckWallet, ...props }: DialogActionsProps) => (
  <BaseDialogActions
    {...props}
    confirmGate={
      confirmCheckWallet
        ? (renderConfirm) => (
            <CheckWallet {...(confirmCheckWallet === true ? {} : confirmCheckWallet)}>
              {(isOk) => <>{renderConfirm(isOk)}</>}
            </CheckWallet>
          )
        : undefined
    }
  />
)

export default DialogActions
