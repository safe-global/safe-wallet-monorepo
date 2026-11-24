import { TxModalContext } from '@/components/tx-flow'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState, useMemo } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import TxSubmitError from '@/components/tx/TxSubmitError'

import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import CheckWallet from '@/components/common/CheckWallet'
import { useIsExecutionLoop } from '@/components/tx/shared/hooks'
import type { SafeTransaction } from '@safe-global/types-kit'
import { asError } from '@safe-global/utils/services/exceptions/utils'

import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
// Imports inside this file are part of the lazy GP chunk — pulling
// `useIsGnosisPayOwner` (zodiac) and `useGnosisPayDelayModifier`
// (recovery-sender → zodiac) here is fine.
import { useIsGnosisPayOwner } from './hooks/useIsGnosisPayOwner'
import { useGnosisPayDelayModifier } from './hooks/useGnosisPayDelayModifier'
import useWallet from '@/hooks/wallets/useWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useNow } from './hooks/useNow'
import { useGnosisPayCooldown } from './hooks/useGnosisPayCooldown'
import { canExecuteQueuedTx } from './utils/canExecuteQueuedTx'
import { assertGnosisPayExecution, waitForGnosisPayReceipt } from './utils/submitGnosisPayTx'
import GnosisPayIcon from '@/public/images/common/gnosis-pay.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getGnosisPayTxWarnings } from './utils/getGnosisPayTxWarnings'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { type GnosisPayTxItem } from './types'
import { useGnosisPayActions } from './hooks/useGnosisPayActions'
import { refreshGnosisPayQueue } from './hooks/useGnosisPayQueue'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

type SubmitCallback = (txId: string, isExecuted?: boolean) => void

export const GnosisPayExecutionForm = ({
  safeTx,
  disableSubmit = false,
  isGnosisPayOwner,
  isExecutionLoop,
  txSecurity,
  onSubmit,
  safeInfo,
  queuedGnosisPayTx,
}: {
  isGnosisPayOwner: ReturnType<typeof useIsGnosisPayOwner>
  isExecutionLoop: ReturnType<typeof useIsExecutionLoop>
  txSecurity: ReturnType<typeof useSafeShield>
  safeTx?: SafeTransaction
  safeInfo: ReturnType<typeof useSafeInfo>
  queuedGnosisPayTx?: GnosisPayTxItem
  disableSubmit?: boolean
  onSubmit?: SubmitCallback
}): ReactElement => {
  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()

  // Hooks
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const { setTxFlow } = useContext(TxModalContext)
  const [delayModifier] = useGnosisPayDelayModifier()
  const [isOwner, ownerError, ownerLoading] = isGnosisPayOwner
  const wallet = useWallet()
  const wrongChain = useIsWrongChain()
  const now = useNow()
  const [cooldown] = useGnosisPayCooldown()

  const { enqueueTx, executeTx } = useGnosisPayActions(
    delayModifier?.delayModifier,
    safeTx?.data ?? queuedGnosisPayTx?.txData,
  )

  const [delayModifierNonces, nonceError, nonceLoading] = useAsync(async () => {
    if (!delayModifier?.delayModifier) {
      return
    }
    const txNonce = await delayModifier.delayModifier.txNonce()
    return { txNonce }
  }, [delayModifier])

  const txWarnings = useMemo(
    () => getGnosisPayTxWarnings(queuedGnosisPayTx?.txData ?? safeTx, safeInfo.safe),
    [safeInfo.safe, safeTx, queuedGnosisPayTx],
  )

  const isNotNextInQueue =
    delayModifierNonces && queuedGnosisPayTx && BigInt(queuedGnosisPayTx.queueNonce) !== delayModifierNonces.txNonce

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (submitDisabled || !delayModifier?.delayModifier || !wallet) {
      return
    }

    if (needsRiskConfirmation && !isRiskConfirmed) {
      return
    }

    setIsSubmittable(false)
    setSubmitError(undefined)

    try {
      await assertGnosisPayExecution(delayModifier.delayModifier, wallet.address, queuedGnosisPayTx)
      const result = queuedGnosisPayTx ? await executeTx() : await enqueueTx()
      const receipt = await waitForGnosisPayReceipt(result)
      refreshGnosisPayQueue()
      onSubmit?.(receipt.hash, queuedGnosisPayTx ? true : undefined)
      setTxFlow(undefined)
    } catch (_err) {
      const err = asError(_err)
      trackError(Errors._804, err)
      setIsSubmittable(true)
      setSubmitError(err)
      return
    }
  }

  const cannotPropose = !isOwner || !!ownerError || !!ownerLoading
  const submitDisabled =
    (!safeTx && !queuedGnosisPayTx) ||
    !delayModifierNonces ||
    !!nonceError ||
    !!nonceLoading ||
    wrongChain ||
    (!!queuedGnosisPayTx && !canExecuteQueuedTx(queuedGnosisPayTx, delayModifierNonces?.txNonce, now)) ||
    !isSubmittable ||
    disableSubmit ||
    isExecutionLoop ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-col gap-4">
        <Alert variant="info">
          <GnosisPayIcon className="size-5" aria-label="Gnosis Pay" />
          <AlertTitle>Gnosis Pay</AlertTitle>
          <AlertDescription>
            {queuedGnosisPayTx ? (
              <p>
                This is an activated Gnosis Pay Safe. You are about to execute the next transaction in the Delay queue
                of the Safe.
              </p>
            ) : (
              <>
                <p>
                  This is an activated Gnosis Pay Safe. Transaction executions have{' '}
                  {cooldown === undefined ? 'a contract-defined cooldown' : `a cooldown of ${cooldown} seconds`} and
                  require two transactions:
                </p>
                <ul className="list-disc pl-5">
                  <li>Announce / Queue a new transaction</li>
                  <li>Execute the transaction after the cooldown has elapsed</li>
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>

        {txWarnings.length > 0 && (
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertTitle>Potential problems</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5">
                {txWarnings.map((txWarning, idx) => (
                  <li key={idx}>{txWarning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {isNotNextInQueue && (
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertTitle>Unknown queued transaction</AlertTitle>
            <AlertDescription>
              There are one or more transactions in front of this one in the Delay queue. You have to skip or execute
              that one first.
            </AlertDescription>
          </Alert>
        )}

        <NetworkWarning />

        {cannotPropose ? (
          <NonOwnerError />
        ) : (
          isExecutionLoop && (
            <ErrorMessage>
              Cannot execute a transaction from the Safe Account itself, please connect a different account.
            </ErrorMessage>
          )
        )}

        {submitError && <TxSubmitError error={submitError} />}
      </div>

      <Separator bleed="6" className="my-7" />

      <TxCardActions>
        {/* allowGnosisPaySafe lets read-only viewers past CheckWallet; the
            actual owner gate is enforced via `cannotPropose` in submitDisabled. */}
        <CheckWallet allowGnosisPaySafe checkNetwork={!submitDisabled}>
          {(isOk) => (
            <Button variant="default" size="submit" type="submit" disabled={!isOk || submitDisabled}>
              {!isSubmittable ? <Spinner className="size-5" /> : 'Execute'}
            </Button>
          )}
        </CheckWallet>
      </TxCardActions>
    </form>
  )
}

export default madProps(GnosisPayExecutionForm, {
  isGnosisPayOwner: useIsGnosisPayOwner,
  isExecutionLoop: useIsExecutionLoop,
  txSecurity: useSafeShield,
  safeInfo: useSafeInfo,
})
