import React from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import { SafeTab } from '@/src/components/SafeTab'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

import { TokensContainer } from '@/src/features/Assets/components/Tokens'
import { NFTsContainer } from '@/src/features/Assets/components/NFTs'
import { AssetsHeaderContainer } from '@/src/features/Assets/components/AssetsHeader'

const tabItems = [
  {
    label: 'Tokens',
    Component: TokensContainer,
  },
  {
    label: `NFTs`,
    Component: NFTsContainer,
  },
]

export function AssetsContainer() {
  const router = useRouter()

  const handleOpenManageTokens = () => {
    router.push('/manage-tokens-sheet')
  }

  const renderRightNode = (activeTabLabel: string) => {
    if (activeTabLabel !== 'Tokens') {
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
