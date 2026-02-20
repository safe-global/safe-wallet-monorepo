import React from 'react'
import { BalanceContainer } from '../Balance'
import { PendingTransactions } from '@/src/components/StatusBanners/PendingTransactions'
import { View } from 'tamagui'
import { StyledAssetsHeader } from './styles'
import { ReadOnlyContainer } from '../ReadOnly/ReadOnly.container'

interface AssetsHeaderProps {
  amount: number
  isLoading: boolean
  onPendingTransactionsPress: () => void
  hasMore: boolean
}

export function AssetsHeader({ amount, isLoading, onPendingTransactionsPress, hasMore }: AssetsHeaderProps) {
  return (
    <StyledAssetsHeader>
      <ReadOnlyContainer />

      <BalanceContainer />

      {amount > 0 && (
        <View marginTop="$4">
          <PendingTransactions
            isLoading={isLoading}
            onPress={onPendingTransactionsPress}
            number={`${amount}${hasMore ? '+' : ''}`}
          />
        </View>
      )}
    </StyledAssetsHeader>
  )
}
