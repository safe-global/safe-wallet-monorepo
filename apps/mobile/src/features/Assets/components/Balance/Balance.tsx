import React from 'react'
import { View } from 'tamagui'

import { Fiat } from '@/src/components/Fiat'
import { Skeleton } from 'moti/skeleton'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useTheme } from '@/src/theme/hooks/useTheme'

interface BalanceProps {
  isLoading: boolean
  balanceAmount: string
}

export function Balance({ isLoading, balanceAmount }: BalanceProps) {
  const { colorScheme } = useTheme()
  const currency = useAppSelector(selectCurrency)

  const showSkeleton = isLoading || !balanceAmount

  return (
    <View alignItems="center" justifyContent="center" paddingVertical="$4" width="100%">
      <Skeleton.Group show={showSkeleton}>
        <Skeleton colorMode={colorScheme} width={220}>
          <View alignItems="center">
            <Fiat value={balanceAmount} currency={currency} precise />
          </View>
        </Skeleton>
      </Skeleton.Group>
    </View>
  )
}
