import React from 'react'
import { View } from 'tamagui'

import { Fiat } from '@/src/components/Fiat'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'

interface BalanceProps {
  isLoading: boolean
  balanceAmount: string
}

export function Balance({ isLoading, balanceAmount }: BalanceProps) {
  const currency = useAppSelector(selectCurrency)

  const showSkeleton = isLoading || !balanceAmount

  return (
    <View alignItems="center" justifyContent="center" paddingVertical="$4" width="100%">
      <SafeSkeleton.Group show={showSkeleton}>
        <SafeSkeleton width={220}>
          <View alignItems="center">
            <Fiat value={balanceAmount} currency={currency} precise />
          </View>
        </SafeSkeleton>
      </SafeSkeleton.Group>
    </View>
  )
}
