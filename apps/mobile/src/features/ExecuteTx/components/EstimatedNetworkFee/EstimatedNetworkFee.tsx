import React from 'react'
import { Text, View } from 'tamagui'
import { router } from 'expo-router'

import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

interface EstimatedNetworkFeeProps {
  totalFee: string
  txId: string
}

export const EstimatedNetworkFee = ({ totalFee, txId }: EstimatedNetworkFeeProps) => {
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

      {/* TODO: get the gas fee from the tx */}
      <View flexDirection="row" alignItems="center" onPress={onPress}>
        <View
          borderStyle="dashed"
          borderBottomWidth={1}
          borderColor="$color"
        >
          <Text fontWeight={700}>
            {totalFee} {chain?.nativeCurrency.symbol}
          </Text>
        </View>
      </View>
    </View>
  )
}
