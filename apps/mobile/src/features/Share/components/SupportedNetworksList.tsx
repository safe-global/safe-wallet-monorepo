import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Logo } from '@/src/components/Logo'

function NetworkRow({ chain }: { chain: Chain }) {
  return (
    <XStack height={64} paddingHorizontal="$3" gap="$3" alignItems="center" width="100%" testID="supported-network-row">
      <Logo logoUri={chain.chainLogoUri} accessibilityLabel={chain.chainName} size="$10" />
      <Text fontSize={14} fontWeight={600} color="$color">
        {chain.chainName}
      </Text>
    </XStack>
  )
}

function TestnetsDivider() {
  return (
    <XStack alignItems="center" gap="$3" paddingHorizontal="$3" paddingVertical="$2" width="100%">
      <View flex={1} height={1} backgroundColor="$borderLight" />
      <Text fontSize={14} color="$colorSecondary">
        Testnets
      </Text>
      <View flex={1} height={1} backgroundColor="$borderLight" />
    </XStack>
  )
}

export function SupportedNetworksList({ chains }: { chains: Chain[] }) {
  const mainnets: Chain[] = []
  const testnets: Chain[] = []
  for (const chain of chains) {
    ;(chain.isTestnet ? testnets : mainnets).push(chain)
  }

  return (
    <YStack width="100%">
      {mainnets.map((chain) => (
        <NetworkRow key={chain.chainId} chain={chain} />
      ))}
      {testnets.length > 0 ? <TestnetsDivider /> : null}
      {testnets.map((chain) => (
        <NetworkRow key={chain.chainId} chain={chain} />
      ))}
    </YStack>
  )
}
