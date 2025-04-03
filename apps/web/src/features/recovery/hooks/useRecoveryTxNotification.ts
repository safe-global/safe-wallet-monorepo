import { useEffect } from 'react'

import { formatError } from '@safe-global/utils/utils/formatters'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import useSafeAddress from '../../../hooks/useSafeAddress'
import { RecoveryEvent, RecoveryTxType, recoverySubscribe } from '@/features/recovery/services/recoveryEvents'
import { useCurrentChain } from '../../../hooks/useChains'
import { isWalletRejection } from '@/utils/wallets'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

const SUCCESS_EVENTS = [
  RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET,
  RecoveryEvent.PROCESSED,
  RecoveryEvent.SUCCESS,
]

const RecoveryTxNotifications = {
  [RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET]: 'Confirm the execution in your wallet.',
  [RecoveryEvent.PROCESSING]: 'Validating...',
  [RecoveryEvent.PROCESSED]: 'Successfully validated. Loading...',
  [RecoveryEvent.REVERTED]: 'Reverted. Please check your gas settings.',
  [RecoveryEvent.FAILED]: 'Failed.',
  [RecoveryEvent.SUCCESS]: 'Successfully executed.',
}

const RecoveryTxNotificationTitles = {
  [RecoveryTxType.PROPOSAL]: 'Account recovery proposal',
  [RecoveryTxType.EXECUTION]: 'Account recovery',
  [RecoveryTxType.SKIP_EXPIRED]: 'Account recovery cancellation',
}

export function useRecoveryTxNotifications(): void {
  const dispatch = useAppDispatch()
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()

  /**
   * Show notifications of a recovery transaction's lifecycle
   */

  useEffect(() => {
    if (!chain?.blockExplorerUriTemplate) {
      return
    }

    const entries = Object.entries(RecoveryTxNotifications) as Array<[keyof typeof RecoveryTxNotifications, string]>

    const unsubFns = entries.map(([event, notification]) =>
      recoverySubscribe(event, async (detail) => {
        const isSuccess = SUCCESS_EVENTS.includes(event)
        const isError = 'error' in detail
        if (isError && isWalletRejection(detail.error)) return

        const txHash = 'txHash' in detail ? detail.txHash : undefined
        const recoveryTxHash = 'recoveryTxHash' in detail ? detail.recoveryTxHash : undefined
        const groupKey = txHash || recoveryTxHash || ''

        const title = RecoveryTxNotificationTitles[detail.txType]
        const message = isError ? `${notification} ${formatError(detail.error)}` : notification

        const link = txHash ? getExplorerLink(txHash, chain.blockExplorerUriTemplate) : undefined

        dispatch(
          showNotification({
            title,
            message,
            detailedMessage: isError ? detail.error.message : undefined,
            groupKey,
            variant: isError ? 'error' : isSuccess ? 'success' : 'info',
            link,
          }),
        )
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [dispatch, safeAddress, chain?.blockExplorerUriTemplate])
}
