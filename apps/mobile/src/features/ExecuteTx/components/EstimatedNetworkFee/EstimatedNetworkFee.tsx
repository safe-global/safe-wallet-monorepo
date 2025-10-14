import React from 'react'
import { Text, View } from 'tamagui'
import { router } from 'expo-router'
import { Skeleton } from 'moti/skeleton'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { RelayFee } from '../RelayFee'
import { SignerFee } from '../SignerFee'

interface EstimatedNetworkFeeProps {
  totalFee: string
  txId: string
  willFail?: boolean
  executionMethod: ExecutionMethod
  isLoadingFees: boolean
}

export const EstimatedNetworkFee = ({
  totalFee,
  txId,
  executionMethod,
  isLoadingFees,
  willFail,
}: EstimatedNetworkFeeProps) => {
  const chain = useAppSelector(selectActiveChain)
  const { colorScheme } = useTheme()
  const activeSafe = useDefinedActiveSafe()

  const { currentData: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
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

      {isLoadingFees || isLoadingRelays ? (
        <Skeleton colorMode={colorScheme} height={16} width={100} />
      ) : executionMethod === ExecutionMethod.WITH_RELAY ? (
        <RelayFee
          willFail={willFail}
          onFailTextPress={onPress}
          isLoadingRelays={isLoadingRelays}
          relaysRemaining={relaysRemaining}
        />
      ) : (
        <SignerFee
          totalFee={totalFee}
          willFail={willFail}
          currencySymbol={chain?.nativeCurrency.symbol}
          onPress={onPress}
        />
      )}
    </View>
  )
}
