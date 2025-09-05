import { router } from 'expo-router'
import React from 'react'
import { Button, View } from 'tamagui'

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
    <View height="$10" alignItems="center">
      <Button
        paddingHorizontal="$2"
        height="$9"
        borderRadius={8}
        borderWidth={0}
        backgroundColor="$borderLight"
        fontWeight="700"
        size="$4"
        fullscreen
        onPress={goToAdvancedDetails}
      >
        {title}
      </Button>
    </View>
  )
}
