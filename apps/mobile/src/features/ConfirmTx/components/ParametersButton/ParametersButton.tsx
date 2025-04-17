import { router } from 'expo-router'
import React from 'react'
import { Button, View } from 'tamagui'

interface ParametersButtonProps {
  txId: string
}

export function ParametersButton({ txId }: ParametersButtonProps) {
  const handleViewParameters = () => {
    router.push({
      pathname: '/transaction-parameters',
      params: { txId },
    })
  }

  return (
    <View height="$10" alignItems="center">
      <Button
        paddingHorizontal="$2"
        height="$10"
        borderRadius="$3"
        backgroundColor="$borderLight"
        fontWeight="500"
        size="$5"
        fullscreen
        onPress={handleViewParameters}
      >
        View Parameters
      </Button>
    </View>
  )
}
