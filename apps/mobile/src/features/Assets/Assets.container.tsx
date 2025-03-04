import React from 'react'

import { SafeTab } from '@/src/components/SafeTab'

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
  return <SafeTab items={tabItems} headerHeight={200} renderHeader={AssetsHeaderContainer} />
}
