import usePendingTxs from '@/src/hooks/usePendingTxs'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { router } from 'expo-router'
import { useCallback } from 'react'
import { AssetsHeader } from './AssetsHeader'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasSigner } from '@/src/hooks/useHasSigner'

export const AssetsHeaderContainer = () => {
  const { amount, hasMore, isLoading } = usePendingTxs()
  const { hasSigner } = useHasSigner()
  const isSendEnabled = useHasFeature(FEATURES.SEND_FLOW) ?? false

  const onPendingTransactionsPress = useCallback(() => {
    router.push('/pending-transactions')
  }, [router])

  const onSendPress = useCallback(() => {
    router.push('/(send)/recipient')
  }, [router])

  const onReceivePress = useCallback(() => {
    router.push('/share')
  }, [router])

  return (
    <AssetsHeader
      isLoading={isLoading}
      hasMore={hasMore}
      amount={amount}
      onPendingTransactionsPress={onPendingTransactionsPress}
      showSendButton={hasSigner && isSendEnabled}
      onSendPress={onSendPress}
      onReceivePress={onReceivePress}
    />
  )
}
