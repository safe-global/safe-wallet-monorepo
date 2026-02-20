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
    <View>
      <Skeleton.Group show={showSkeleton}>
        <Skeleton colorMode={colorScheme} width={220}>
          <Fiat value={balanceAmount} currency={currency} precise />
        </Skeleton>
      </Skeleton.Group>
    </View>
  )
}
