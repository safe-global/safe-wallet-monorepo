import StatusStepper from './StatusStepper'
import classnames from 'classnames'
import NextLink from 'next/link'
import css from './styles.module.css'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import useSafeInfo from '@/hooks/useSafeInfo'
import { TxModalContext } from '../..'
import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { ProcessingStatus } from '@/components/tx-flow/flows/SuccessScreen/statuses/ProcessingStatus'
import { IndexingStatus } from '@/components/tx-flow/flows/SuccessScreen/statuses/IndexingStatus'
import { DefaultStatus } from '@/components/tx-flow/flows/SuccessScreen/statuses/DefaultStatus'
import { isSwapTransferOrderTxInfo } from '@/utils/transaction-guards'
import { getTxLink } from '@/utils/tx-link'
import useTxDetails from '@/hooks/useTxDetails'
import { usePredictSafeAddressFromTxDetails } from '@/hooks/usePredictSafeAddressFromTxDetails'
import { AppRoutes } from '@/config/routes'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  /** The ID assigned to the transaction in the client-gateway */
  txId?: string
  /** For module transaction, pass the transaction hash while the `txId` is not yet available */
  txHash?: string
}

const SuccessScreen = ({ txId, txHash }: Props) => {
  const [localTxHash, setLocalTxHash] = useState<string | undefined>(txHash)
  const [error, setError] = useState<Error>()
  const hasSucceededRef = useRef(false)
  const { setTxFlow } = useContext(TxModalContext)
  const chain = useCurrentChain()
  const pendingTx = useAppSelector((state) => (txId ? selectPendingTxById(state, txId) : undefined))
  const { safeAddress } = useSafeInfo()
  const status = !txId && txHash ? PendingStatus.INDEXING : pendingTx?.status
  const pendingTxHash = pendingTx && 'txHash' in pendingTx ? pendingTx.txHash : undefined
  const txLink = chain && txId && getTxLink(txId, chain, safeAddress)
  const [txDetails] = useTxDetails(txId)
  const isSwapOrder = txDetails && isSwapTransferOrderTxInfo(txDetails.txInfo)
  const [predictedSafeAddress] = usePredictSafeAddressFromTxDetails(txDetails)

  useEffect(() => {
    if (!pendingTxHash) return

    setLocalTxHash(pendingTxHash)
  }, [pendingTxHash])

  useEffect(() => {
    if (!txId) return

    hasSucceededRef.current = false

    // Deliberately independent of `pendingTx`: the same events clear it from the store, so reading it
    // here would tie the error state to the order in which the subscribers happen to run.
    // Success is authoritative instead — `PROCESSED` needs a receipt that did not revert and `SUCCESS`
    // needs the tx indexed, so it both clears a failure already reported by a stale watcher (the
    // replaced hash of a sped-up tx, the relay timeout) and suppresses any later one.
    const unsubFns: Array<() => void> = [
      ...([TxEvent.PROCESSED, TxEvent.SUCCESS] as const).map((event) =>
        txSubscribe(event, (detail) => {
          if (detail.txId !== txId) return

          hasSucceededRef.current = true
          setError(undefined)
        }),
      ),
      ...([TxEvent.FAILED, TxEvent.REVERTED] as const).map((event) =>
        txSubscribe(event, (detail) => {
          if (detail.txId === txId && !hasSucceededRef.current) setError(detail.error)
        }),
      ),
    ]

    return () => unsubFns.forEach((unsubscribe) => unsubscribe())
  }, [txId])

  const onClose = useCallback(() => {
    setTxFlow(undefined)
  }, [setTxFlow])

  const isSuccess = !error && status === undefined
  const spinnerStatus = error ? SpinnerStatus.ERROR : isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING

  // A known error wins over any pending status: the tx is already mined, so it can neither keep
  // processing nor be sped up
  const displayedStatus = error ? undefined : status

  let StatusComponent
  switch (displayedStatus) {
    case PendingStatus.PROCESSING:
    case PendingStatus.RELAYING:
      // status can only have these values if txId & pendingTx are defined
      StatusComponent = <ProcessingStatus txId={txId!} pendingTx={pendingTx!} willDeploySafe={!!predictedSafeAddress} />
      break
    case PendingStatus.INDEXING:
      StatusComponent = <IndexingStatus willDeploySafe={!!predictedSafeAddress} />
      break
    default:
      StatusComponent = <DefaultStatus error={error} willDeploySafe={!!predictedSafeAddress} />
  }

  return (
    <div className="mx-auto w-full max-w-[825px] rounded-xl bg-[var(--color-background-paper)] text-center">
      <div className={css.row}>
        <LoadingSpinner status={spinnerStatus} />
        {StatusComponent}
      </div>

      {!error && (
        <>
          <Separator />
          <div className={css.row}>
            <StatusStepper status={status} txHash={localTxHash} />
          </div>
        </>
      )}

      <Separator />

      <div className={classnames(css.row, css.buttons)}>
        {isSwapOrder && (
          <Button data-testid="finish-transaction-btn" variant="outline" size="sm" onClick={onClose}>
            Back to swaps
          </Button>
        )}

        {txLink && (
          <Button
            data-testid="view-transaction-btn"
            variant={isSwapOrder ? 'default' : 'outline'}
            size="sm"
            onClick={onClose}
            render={<NextLink {...txLink} target="_blank" rel="noreferrer" />}
          >
            View transaction
          </Button>
        )}

        {!isSwapOrder &&
          (predictedSafeAddress ? (
            <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.success_screen}>
              <Button
                data-testid="open-nested-safe-btn"
                variant="default"
                size="sm"
                onClick={onClose}
                disabled={!isSuccess}
                render={
                  <NextLink
                    href={{ pathname: AppRoutes.home, query: { safe: `${chain?.shortName}:${predictedSafeAddress}` } }}
                  />
                }
              >
                Go to Nested Safe
              </Button>
            </Track>
          ) : (
            <Button data-testid="finish-transaction-btn" variant="default" size="sm" onClick={onClose}>
              Finish
            </Button>
          ))}
      </div>
    </div>
  )
}

export default SuccessScreen
