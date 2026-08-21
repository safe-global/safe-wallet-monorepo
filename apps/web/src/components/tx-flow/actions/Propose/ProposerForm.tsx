import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import { isWalletRejection } from '@/utils/wallets'
import { type ReactElement, type SyntheticEvent, useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import type { SafeTransaction } from '@safe-global/types-kit'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { useTxActions } from '@/components/tx/shared/hooks'
import type { SignOrExecuteProps } from '@/components/tx/shared/types'
import useWallet from '@/hooks/wallets/useWallet'
import { Errors, trackError } from '@/services/exceptions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import madProps from '@/utils/mad-props'
import { TxCardFooter } from '@/components/tx-flow/common/TxCard'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

export const ProposerForm = ({
  safeTx,
  origin,
  disableSubmit = false,
  txActions,
  txSecurity,
  onSubmit,
}: SignOrExecuteProps & {
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useSafeShield>
  safeTx?: SafeTransaction
}): ReactElement => {
  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)

  // Hooks
  const wallet = useWallet()
  const { signProposerTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx || !wallet) return

    setIsSubmittable(false)
    setIsRejectedByUser(false)

    try {
      const txId = await signProposerTx(safeTx, origin)
      onSubmit?.(txId)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._805, err)
      }
      setIsSubmittable(true)
      return
    }

    setTxFlow(undefined)
  }

  const submitDisabled = !safeTx || !isSubmittable || disableSubmit || (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <form onSubmit={handleSubmit}>
      <Typography>
        As a <strong>Proposer</strong>, you&apos;re creating this transaction without any signatures. It will need
        approval from a signer before it becomes a valid transaction.
      </Typography>

      {isRejectedByUser && (
        <div className="mt-2">
          <WalletRejectionError />
        </div>
      )}

      <TxCardFooter className="mt-6">
        {/* Submit button */}
        <CheckWallet checkNetwork>
          {(isOk) => (
            <Button
              data-testid="sign-btn"
              type="submit"
              size="submit"
              disabled={!isOk || submitDisabled}
              className="order-1 w-full lg:w-auto"
            >
              {!isSubmittable ? <Spinner className="size-5" /> : 'Propose transaction'}
            </Button>
          )}
        </CheckWallet>
      </TxCardFooter>
    </form>
  )
}

export default madProps(ProposerForm, {
  txActions: useTxActions,
  txSecurity: useSafeShield,
})
