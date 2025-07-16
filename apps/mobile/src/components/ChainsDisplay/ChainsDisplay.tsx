import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import React, { useMemo } from 'react'
import { View } from 'tamagui'
import { Logo } from '../Logo'
import { Badge } from '../Badge'

interface ChainsDisplayProps {
  chains: Chain[]
  max?: number
  activeChainId?: string
}

export function ChainsDisplay({ chains, activeChainId, max }: ChainsDisplayProps) {
  const orderedChains = useMemo(
    () => [...chains].sort((a, b) => (a.chainId === activeChainId ? -1 : b.chainId === activeChainId ? 1 : 0)),
    [chains],
  )
  const slicedChains = max ? orderedChains.slice(0, max) : chains
  const showBadge = max && chains.length > max

  return (
    <View flexDirection="row">
      {slicedChains.map(({ chainLogoUri, chainName, chainId }, index) => (
        <View
          key={chainId}
          testID="chain-display"
          marginRight={showBadge || index !== slicedChains.length - 1 ? -6 : 0}
        >
          <Logo size="$6" logoUri={chainLogoUri} accessibilityLabel={chainName} />
        </View>
      ))}

      {showBadge && (
        <Badge
          testID="more-chains-badge"
          circleSize="$6"
          content={`+${chains.length - max}`}
          themeName="badge_background"
        />
      )}
    </View>
  )
}
