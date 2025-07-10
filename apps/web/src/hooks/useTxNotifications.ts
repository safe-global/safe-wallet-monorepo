import { useEffect, useMemo, useRef } from 'react'
import { formatError } from '@safe-global/utils/utils/formatters'
import { selectNotifications, showNotification } from '@/store/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { useCurrentChain } from './useChains'
import useTxQueue from './useTxQueue'
import { isSignableBy, isTransactionListItem } from '@/utils/transaction-guards'
import { TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'
import { selectPendingTxs } from '@/store/pendingTxsSlice'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from './wallets/useWallet'
import useSafeAddress from './useSafeAddress'
import { isWalletRejection } from '@/utils/wallets'
import { getTxLink } from '@/utils/tx-link'
import { useLazyGetTransactionDetailsQuery } from '@/store/api/gateway'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

const TxNotifications = {
  [TxEvent.SIGN_FAILED]: 'Failed to sign. Please try again.',
  [TxEvent.PROPOSED]: 'Successfully added to queue.',
  [TxEvent.PROPOSE_FAILED]: 'Failed to add to queue. Please try again.',
  [TxEvent.DELETED]: 'Successfully deleted transaction.',
  [TxEvent.SIGNATURE_PROPOSED]: 'Successfully signed.',
  [TxEvent.SIGNATURE_PROPOSE_FAILED]: 'Failed to send signature. Please try again.',
  [TxEvent.EXECUTING]: 'Confirm the execution in your wallet.',
  [TxEvent.PROCESSING]: 'Validating...',
  [TxEvent.PROCESSING_MODULE]: 'Validating module interaction...',
  [TxEvent.ONCHAIN_SIGNATURE_REQUESTED]: 'Confirm on-chain signature in your wallet.',
  [TxEvent.ONCHAIN_SIGNATURE_SUCCESS]: 'On-chain signature request confirmed.',
  [TxEvent.PROCESSED]: 'Successfully validated. Indexing...',
  [TxEvent.REVERTED]: 'Reverted. Please check your gas settings.',
  [TxEvent.SUCCESS]: 'Successfully executed.',
  [TxEvent.FAILED]: 'Failed.',
}

enum Variant {
  INFO = 'info',
  SUCCESS = 'success',
  ERROR = 'error',
}

const successEvents = [TxEvent.PROPOSED, TxEvent.SIGNATURE_PROPOSED, TxEvent.ONCHAIN_SIGNATURE_SUCCESS, TxEvent.SUCCESS]

const useTxNotifications = (): void => {
  const dispatch = useAppDispatch()
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const [trigger] = useLazyGetTransactionDetailsQuery()

  /**
   * Show notifications of a transaction's lifecycle
   */

  useEffect(() => {
    if (!chain) return

    const entries = Object.entries(TxNotifications) as [keyof typeof TxNotifications, string][]

    const unsubFns = entries.map(([event, baseMessage]) =>
      txSubscribe(event, async (detail) => {
        const isError = 'error' in detail
        if (isError && isWalletRejection(detail.error)) return
        const isSuccess = successEvents.includes(event)
        const message = isError ? `${baseMessage} ${formatError(detail.error)}` : baseMessage
        const txId = 'txId' in detail ? detail.txId : undefined
        const txHash = 'txHash' in detail ? detail.txHash : undefined
        const groupKey = 'groupKey' in detail && detail.groupKey ? detail.groupKey : txId || ''

        let humanDescription = 'Transaction'
        const id = txId || txHash
        if (id) {
          try {
            const { data: txDetails } = await trigger({ chainId: chain.chainId, txId: id })
            humanDescription = txDetails?.txInfo.humanDescription || humanDescription
          } catch {}
        }

        dispatch(
          showNotification({
            title: humanDescription,
            message,
            detailedMessage: isError ? detail.error.message : undefined,
            groupKey,
            variant: isError ? Variant.ERROR : isSuccess ? Variant.SUCCESS : Variant.INFO,
            link: txId
              ? getTxLink(txId, chain, safeAddress)
              : txHash
                ? getExplorerLink(txHash, chain.blockExplorerUriTemplate)
                : undefined,
          }),
        )
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [dispatch, safeAddress, chain, trigger])

  /**
   * If there's at least one transaction awaiting confirmations, show a notification for it
   */

  const { page } = useTxQueue()
  const isOwner = useIsSafeOwner()
  const pendingTxs = useAppSelector(selectPendingTxs)
  const notifications = useAppSelector(selectNotifications)
  const wallet = useWallet()
  const notifiedAwaitingTxIds = useRef<Array<string>>([])

  const txsAwaitingConfirmation = useMemo(() => {
    if (!page?.results) {
      return []
    }

    return page.results.filter(isTransactionListItem).filter(({ transaction }) => {
      const isAwaitingConfirmations = transaction.txStatus === TransactionStatus.AWAITING_CONFIRMATIONS
      const isPending = !!pendingTxs[transaction.id]
      const canSign = isSignableBy(transaction, wallet?.address || '')
      return isAwaitingConfirmations && !isPending && canSign
    })
  }, [page?.results, pendingTxs, wallet?.address])

  useEffect(() => {
    if (!isOwner || txsAwaitingConfirmation.length === 0) {
      return
    }

    const txId = txsAwaitingConfirmation[0].transaction.id
    const hasNotified = notifiedAwaitingTxIds.current.includes(txId)

    if (hasNotified) {
      return
    }

    dispatch(
      showNotification({
        variant: 'info',
        message: 'A transaction requires your confirmation.',
        link: chain && getTxLink(txId, chain, safeAddress),
        groupKey: txId,
      }),
    )

    notifiedAwaitingTxIds.current.push(txId)
  }, [chain, dispatch, isOwner, notifications, safeAddress, txsAwaitingConfirmation])
}

export default useTxNotifications
