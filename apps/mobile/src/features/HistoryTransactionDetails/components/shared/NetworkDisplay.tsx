import React from 'react'
import { View, Text } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

export function NetworkDisplay() {
  const activeChain = useAppSelector(selectActiveChain)

  return (
    <View alignItems="center" flexDirection="row" justifyContent="space-between">
      <Text color="$textSecondaryLight">Network</Text>
      <View flexDirection="row" alignItems="center" gap="$2">
        <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
        <Text fontSize="$4">{activeChain?.chainName}</Text>
      </View>
    </View>
  )
}
