import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { Skeleton } from 'moti/skeleton'
import { Logo } from '@/src/components/Logo'
import { Fiat } from '@/src/components/Fiat'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById, selectAllChains, useGetChainsConfigQuery } from '@/src/store/chains'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectCurrency } from '@/src/store/settingsSlice'

export interface ChainIndicatorProps {
  chainId?: string
  showUnknown?: boolean
  showLogo?: boolean
  onlyLogo?: boolean
  fiatValue?: string
  imageSize?: string
  currency?: string
}

const fallbackChainConfig = {
  chainId: '-1',
  chainName: 'Unknown network',
  chainLogoUri: null,
  theme: {
    backgroundColor: '#ddd',
    textColor: '#000',
  },
}

export const ChainIndicator = ({
  chainId: propChainId,
  showUnknown = true,
  showLogo = true,
  onlyLogo = false,
  fiatValue,
  imageSize = '$6',
  currency: propCurrency,
}: ChainIndicatorProps) => {
  // Fetch chains data to ensure it's up to date
  const { isLoading } = useGetChainsConfigQuery()

  const activeSafe = useDefinedActiveSafe()
  const currentChainId = activeSafe.chainId
  const targetChainId = propChainId || currentChainId

  const allChains = useAppSelector(selectAllChains)
  const chainConfig = useAppSelector((state) => selectChainById(state, targetChainId))
  const defaultCurrency = useAppSelector(selectCurrency)

  const currency = propCurrency || defaultCurrency
  const noChains = !allChains || allChains.length === 0
  const finalChainConfig = chainConfig || (showUnknown ? fallbackChainConfig : null)
  if (isLoading || noChains) {
    return <Skeleton width={onlyLogo ? 24 : 115} height={22} radius={4} />
  }

  if (!finalChainConfig) {
    return null
  }

  const content = (
    <>
      {showLogo && (
        <Logo
          logoUri={finalChainConfig.chainLogoUri}
          accessibilityLabel={`${finalChainConfig.chainName} Logo`}
          size={imageSize}
          fallbackIcon="info"
        />
      )}
      {!onlyLogo && (
        <YStack flex={1}>
          <Text
            testID="chain-name"
            fontSize="$3"
            fontWeight="600"
            color="$color"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {finalChainConfig.chainName}
          </Text>
          {fiatValue && <Fiat value={fiatValue} currency={currency} />}
        </YStack>
      )}
    </>
  )

  return (
    <View testID="chain-indicator">
      <XStack
        alignItems="center"
        gap={showLogo ? '$2' : 0}
        minWidth={onlyLogo ? undefined : showLogo ? 115 : 70}
        justifyContent={showLogo ? 'flex-start' : 'center'}
      >
        {content}
      </XStack>
    </View>
  )
}
