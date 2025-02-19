import { SafeCreationEvent, safeCreationSubscribe } from '@/features/counterfactual/services/safeCreationEvents'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppDispatch } from '@/store'
import { useGetAllOwnedSafesQuery } from '@/store/api/gateway'
import { showNotification } from '@/store/notificationsSlice'
import { getBlockExplorerLink } from '@/utils/chains'
import { formatError } from '@/utils/formatters'
import { isWalletRejection } from '@/utils/wallets'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'

const SafeCreationNotifications = {
  [SafeCreationEvent.PROCESSING]: 'Validating...',
  [SafeCreationEvent.RELAYING]: 'Validating...',
  [SafeCreationEvent.SAFENET_RELAYING]: 'Validating...',
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
