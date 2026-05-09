import React from 'react'
import { View, Text } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

interface NetworkRowProps {
  /**
   * Whether to show the "Network" label
   * @default false - for use in ListTable items where label is handled separately
   */
  showLabel?: boolean
}

export function NetworkRow({ showLabel = false }: NetworkRowProps) {
  const activeChain = useAppSelector(selectActiveChain)

  if (!activeChain) {
    return null
  }

  const networkContent = (
    <View flexDirection="row" alignItems="center" gap="$2">
      <Logo logoUri={activeChain.chainLogoUri} size="$6" />
      <Text fontSize="$4">{activeChain.chainName}</Text>
    </View>
  )

  if (showLabel) {
    return (
      <View alignItems="center" flexDirection="row" justifyContent="space-between">
        <Text color="$textSecondaryLight">Network</Text>
        {networkContent}
      </View>
    )
  }

  return networkContent
}
