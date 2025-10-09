import React from 'react'
import { getTokenValue, Text, View } from 'tamagui'
import { router } from 'expo-router'
import { Skeleton } from 'moti/skeleton'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { GradientText } from '@/src/components/GradientText'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

interface EstimatedNetworkFeeProps {
  totalFee: string
  txId: string
  totalFeeRaw: bigint
  executionMethod: ExecutionMethod
  isLoadingFees: boolean
}

export const EstimatedNetworkFee = ({
  totalFee,
  txId,
  totalFeeRaw,
  executionMethod,
  isLoadingFees,
}: EstimatedNetworkFeeProps) => {
  const chain = useAppSelector(selectActiveChain)
  const { colorScheme } = useTheme()
  const activeSafe = useDefinedActiveSafe()

  const { data: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  })

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
        {executionMethod === ExecutionMethod.WITH_RELAY ? (
          <View alignItems="flex-end" flexDirection="row" justifyContent="center" gap="$2">
            <View width="$8">
              <GradientText colors={[getTokenValue('$color.infoMainDark'), getTokenValue('$color.primaryMainDark')]}>
                <Text fontWeight={700}>Free</Text>
              </GradientText>
            </View>

            {isLoadingRelays ? (
              <Skeleton colorMode={colorScheme} height={16} width={80} />
            ) : (
              relaysRemaining && <Text fontWeight={700}>{relaysRemaining.remaining} left / per day</Text>
            )}
          </View>
        ) : isLoadingFees ? (
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
    </View>
  )
}
