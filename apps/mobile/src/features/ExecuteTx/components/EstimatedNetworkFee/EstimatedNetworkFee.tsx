import React from 'react'
import { Text, View } from 'tamagui'
import { router } from 'expo-router'

import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

interface EstimatedNetworkFeeProps {
  totalFee: string
  txId: string
  totalFeeRaw: bigint
}

export const EstimatedNetworkFee = ({ totalFee, txId, totalFeeRaw }: EstimatedNetworkFeeProps) => {
  const chain = useAppSelector(selectActiveChain)

  const onPress = () => {
    router.push({
      pathname: '/change-estimated-fee-sheet',
      params: { txId },
    })
  }

  return (
    <View flexDirection="row" justifyContent="space-between" gap="$2" alignItems="center">
      <Text color="$textSecondaryLight">Est. network fee</Text>

      <View flexDirection="row" alignItems="center" onPress={onPress}>
        <View borderStyle="dashed" borderBottomWidth={totalFeeRaw ? 1 : 0} borderColor="$color">
          {totalFeeRaw ? (
            <Text fontWeight={700}>
              {totalFeeRaw ? `${totalFee} ${chain?.nativeCurrency.symbol}` : 'Can not estimate'}
            </Text>
          ) : (
            <Text color="$error" fontWeight={700}>
              Can not estimate
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
