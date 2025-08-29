import React from 'react'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { SafeButton } from '@/src/components/SafeButton'

interface ViewOnExplorerButtonProps {
  txHash?: string | null
}

export function ViewOnExplorerButton({ txHash }: ViewOnExplorerButtonProps) {
  const viewOnExplorer = useOpenExplorer(txHash || '')

  if (!txHash) {
    return null
  }

  return (
    <View paddingHorizontal="$4" paddingVertical="$2">
      <SafeButton
        outlined
        borderWidth={0}
        onPress={viewOnExplorer}
        iconAfter={<SafeFontIcon name="external-link" size={16} />}
      >
        View on Explorer
      </SafeButton>
    </View>
  )
}
