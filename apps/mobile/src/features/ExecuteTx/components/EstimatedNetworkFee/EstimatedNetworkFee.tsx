import React from 'react'
import { Text, View } from 'tamagui'
import { router } from 'expo-router'
import { Skeleton } from 'moti/skeleton'
import { useTheme } from '@/src/theme/hooks/useTheme'

import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

interface EstimatedNetworkFeeProps {
  totalFee: string
  txId: string
  totalFeeRaw: bigint
  isLoadingFees: boolean
}

export const EstimatedNetworkFee = ({ totalFee, txId, totalFeeRaw, isLoadingFees }: EstimatedNetworkFeeProps) => {
  const chain = useAppSelector(selectActiveChain)
  const { colorScheme } = useTheme()

  const onPress = () => {
    router.push({
      pathname: '/change-estimated-fee-sheet',
      params: { txId },
    })
  }

  return (
    <View flexDirection="row" justifyContent="space-between" gap="$2" alignItems="center">
      <Text color="$textSecondaryLight">Est. network fee</Text>

      {isLoadingFees ? (
        <Skeleton colorMode={colorScheme} height={16} width={100} />
      ) : (
        <View flexDirection="row" alignItems="center" onPress={onPress}>
          <View borderStyle="dashed" borderBottomWidth={totalFeeRaw ? 1 : 0} borderColor="$color">
            {totalFeeRaw ? (
              <Text fontWeight={700}>
                {totalFee} {chain?.nativeCurrency.symbol}
              </Text>
            ) : (
              <Text color="$error" fontWeight={700}>
                Can not estimate
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
