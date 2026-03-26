import { router } from 'expo-router'
import React from 'react'
import { View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'

interface ParametersButtonProps {
  txId: string
  title?: string
}

export function ParametersButton({ txId, title = 'Transaction details' }: ParametersButtonProps) {
  const goToAdvancedDetails = () => {
    router.push({
      pathname: '/transaction-parameters',
      params: { txId },
    })
  }

  return (
    <View>
      <SafeButton secondary size="$sm" onPress={goToAdvancedDetails} testID="transaction-details-button">
        {title}
      </SafeButton>
    </View>
  )
}
