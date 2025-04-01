import { SafeCreationEvent, safeCreationSubscribe } from '@/features/counterfactual/services/safeCreationEvents'
import useWallet from '@/hooks/wallets/useWallet'
import { useGetAllOwnedSafesQuery } from '@/store/api/gateway'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'
import { formatError } from '@safe-global/utils/utils/formatters'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { isWalletRejection } from '@/utils/wallets'

const SafeCreationNotifications = {
  [SafeCreationEvent.PROCESSING]: 'Validating...',
  [SafeCreationEvent.RELAYING]: 'Validating...',
  [SafeCreationEvent.INDEXED]: 'Successfully executed.',
  [SafeCreationEvent.FAILED]: 'Failed.',
  [SafeCreationEvent.REVERTED]: 'Reverted. Please check your gas settings.',
}

enum Variant {
  INFO = 'info',
  SUCCESS = 'success',
  ERROR = 'error',
}

const usePendingSafeNotifications = (): void => {
  const dispatch = useAppDispatch()
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const { address = '' } = useWallet() || {}
  const { refetch } = useGetAllOwnedSafesQuery(address === '' ? skipToken : { walletAddress: address })

  useEffect(() => {
    if (!chain) return

    const entries = Object.entries(SafeCreationNotifications) as [keyof typeof SafeCreationNotifications, string][]

    const unsubFns = entries.map(([event, baseMessage]) =>
      safeCreationSubscribe(event, async (detail) => {
        const isError = 'error' in detail
        if (isError && isWalletRejection(detail.error)) return

        const isSuccess = event === SafeCreationEvent.INDEXED
        const message = isError ? `${baseMessage} ${formatError(detail.error)}` : baseMessage
        const txHash = 'txHash' in detail ? detail.txHash : undefined
        const groupKey = 'groupKey' in detail && detail.groupKey ? detail.groupKey : txHash || ''
        const link = chain && txHash ? getBlockExplorerLink(chain, txHash) : undefined

        // Fetch all owned safes after the Safe has been deployed
        if (isSuccess) {
          refetch()
        }

        dispatch(
          showNotification({
            title: 'Safe Account activation',
            message,
            detailedMessage: isError ? detail.error.message : undefined,
            groupKey,
            variant: isError ? Variant.ERROR : isSuccess ? Variant.SUCCESS : Variant.INFO,
            link,
          }),
        )
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [dispatch, safeAddress, chain, refetch])
}

export default usePendingSafeNotifications
