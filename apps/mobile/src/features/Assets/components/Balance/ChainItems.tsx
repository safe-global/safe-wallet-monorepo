import React from 'react'
import { Text, View } from 'tamagui'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { TouchableOpacity } from 'react-native'

interface ChainItemsProps {
  activeChain?: Chain
  chains: Chain[]
  chainId: string
  fiatTotal: string
  onSelect: (chainId: string) => void
  /** True when the chain was just discovered by a "Scan for new networks" action. */
  isNewlyDiscovered?: boolean
}

export function ChainItems({
  chainId,
  chains,
  activeChain,
  fiatTotal,
  onSelect,
  isNewlyDiscovered = false,
}: ChainItemsProps) {
  const chain = chains.find((item) => item.chainId === chainId)
  const isActive = chainId === activeChain?.chainId

  const handleChainSelect = () => {
    onSelect(chainId)
  }

  if (!chain) {
    return null
  }

  const rightNode =
    isNewlyDiscovered || isActive ? (
      <View flexDirection="row" alignItems="center" columnGap="$2">
        {isNewlyDiscovered && (
          <View
            backgroundColor="$primary"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            testID="new-chain-badge"
          >
            <Text fontSize="$2" fontWeight={600} color="$contrast">
              New
            </Text>
          </View>
        )}
        {isActive && <SafeFontIcon name="check" color="$color" />}
      </View>
    ) : null

  return (
    <TouchableOpacity style={{ width: '100%' }} onPress={handleChainSelect}>
      <View backgroundColor={isActive ? '$borderLight' : '$backgroundTransparent'} borderRadius="$4">
        <AssetsCard
          name={chain.chainName}
          logoUri={chain.chainLogoUri}
          description={`${fiatTotal}`}
          rightNode={rightNode}
        />
      </View>
    </TouchableOpacity>
  )
}
