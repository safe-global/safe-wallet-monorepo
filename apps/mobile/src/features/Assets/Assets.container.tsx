import React, { useMemo } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import { SafeTab } from '@/src/components/SafeTab'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

import { TokensContainer } from '@/src/features/Assets/components/Tokens'
import { NFTsContainer } from '@/src/features/Assets/components/NFTs'
import { PositionsContainer } from '@/src/features/Assets/components/Positions'
import { AssetsHeaderContainer } from '@/src/features/Assets/components/AssetsHeader'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function AssetsContainer() {
  const router = useRouter()
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hasPositions = useHasFeature(FEATURES.POSITIONS)

  const tabItems = useMemo(() => {
    const items = [
      {
        label: 'Tokens',
        Component: TokensContainer,
      },
    ]

    if (hasPositions) {
      items.push({
        label: 'Positions',
        Component: PositionsContainer,
      })
    }

    items.push({
      label: 'NFTs',
      Component: NFTsContainer,
    })

    return items
  }, [hasPositions])

  const handleOpenManageTokens = () => {
    router.push('/manage-tokens-sheet')
  }

  const renderRightNode = (activeTabLabel: string) => {
    if (activeTabLabel !== 'Tokens' || !hasDefaultTokenlist) {
      return null
    }

    return (
      <Pressable hitSlop={8} onPress={handleOpenManageTokens} testID="manage-tokens-button">
        <SafeFontIcon name="options-horizontal" size={20} color="$colorBackdrop" />
      </Pressable>
    )
  }

  return (
    <SafeTab items={tabItems} headerHeight={200} renderHeader={AssetsHeaderContainer} rightNode={renderRightNode} />
  )
}
