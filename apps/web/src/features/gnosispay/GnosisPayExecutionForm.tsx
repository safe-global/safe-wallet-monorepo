import { TxModalContext } from '@/components/tx-flow'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState, useMemo } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
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
import { didRevert } from '@/utils/ethers-utils'
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
  const [isOwner] = isGnosisPayOwner

  const { enqueueTx, executeTx } = useGnosisPayActions(
    delayModifier?.delayModifier,
    safeTx?.data ?? queuedGnosisPayTx?.txData,
  )

  const [delayModifierNonces] = useAsync(async () => {
    if (!delayModifier?.delayModifier) {
      return
    }
    const txNonce = await delayModifier.delayModifier.txNonce()
    return { txNonce }
  }, [delayModifier])

  const txWarnings = useMemo(() => getGnosisPayTxWarnings(safeTx, safeInfo.safe), [safeInfo.safe, safeTx])

  const isNotNextInQueue =
    delayModifierNonces && queuedGnosisPayTx && queuedGnosisPayTx.queueNonce > delayModifierNonces.txNonce

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!delayModifierNonces || (!safeTx && !queuedGnosisPayTx)) {
      return
    }

    if (needsRiskConfirmation && !isRiskConfirmed) {
      return
    }

    setIsSubmittable(false)
    setSubmitError(undefined)

    try {
      // depending on the mode we dispatch something
      if (!queuedGnosisPayTx && safeTx) {
        const queueResult = await enqueueTx()
        const receipt = await queueResult?.wait()
        if (receipt === null || receipt === undefined) {
          throw new Error('No transaction receipt found')
        }
        if (didRevert(receipt)) {
          throw new Error('Transaction reverted by EVM')
        }
        refreshGnosisPayQueue()
        onSubmit?.(receipt.hash)
        // We close the modal
        setTxFlow(undefined)
      } else if (queuedGnosisPayTx) {
        const executeResult = await executeTx()
        const receipt = await executeResult?.wait()
        if (receipt === null || receipt === undefined) {
          throw new Error('No transaction receipt found')
        }
        if (didRevert(receipt)) {
          throw new Error('Transaction reverted by EVM')
        }
        refreshGnosisPayQueue()
        onSubmit?.(receipt.hash, true)
        setTxFlow(undefined)
      }
    } catch (_err) {
      const err = asError(_err)
      trackError(Errors._804, err)
      setIsSubmittable(true)
      setSubmitError(err)
      return
    }
  }

  const cannotPropose = !isOwner
  const submitDisabled =
    (!safeTx && !queuedGnosisPayTx) ||
    !delayModifierNonces ||
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
                  This is an activated Gnosis Pay Safe. Transaction executions have a delay of 3 minutes and require two
                  transactions:
                </p>
                <ul className="list-disc pl-5">
                  <li>Announce / Queue a new transaction</li>
                  <li>Execute the transaction after waiting for 3 minutes</li>
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
