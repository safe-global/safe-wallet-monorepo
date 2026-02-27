import usePendingTxs from '@/src/hooks/usePendingTxs'
import { useHasSigner } from '@/src/hooks/useHasSigner'
import { router } from 'expo-router'
import { useCallback } from 'react'
import { AssetsHeader } from './AssetsHeader'

export const AssetsHeaderContainer = () => {
  const { amount, hasMore, isLoading } = usePendingTxs()
  const { hasSigner } = useHasSigner()

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
      showSendButton={hasSigner}
      onSendPress={onSendPress}
      onReceivePress={onReceivePress}
    />
  )
}
