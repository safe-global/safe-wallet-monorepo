import usePendingTxs from '@/src/hooks/usePendingTxs'
import { router } from 'expo-router'
import { useCallback } from 'react'
import { AssetsHeader } from './AssetsHeader'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const AssetsHeaderContainer = () => {
  const { amount, hasMore, isLoading } = usePendingTxs()
  const hasSendTransfers = true

  const onPendingTransactionsPress = useCallback(() => {
    router.push('/pending-transactions')
  }, [router])

  const onSendPress = useCallback(() => {
    router.push('/(send)/recipient')
  }, [router])

  return (
    <AssetsHeader
      isLoading={isLoading}
      hasMore={hasMore}
      amount={amount}
      onPendingTransactionsPress={onPendingTransactionsPress}
      showSendButton={!!hasSendTransfers}
      onSendPress={onSendPress}
    />
  )
}
