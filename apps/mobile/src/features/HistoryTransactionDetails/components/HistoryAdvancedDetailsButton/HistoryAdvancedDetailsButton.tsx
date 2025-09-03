import React from 'react'
import { View, Button } from 'tamagui'
import { useRouter } from 'expo-router'

interface HistoryAdvancedDetailsButtonProps {
  txId: string
}

export function HistoryAdvancedDetailsButton({ txId }: HistoryAdvancedDetailsButtonProps) {
  const router = useRouter()

  const goToAdvancedDetails = () => {
    router.push({
      pathname: '/history-advanced-details',
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
        View transaction data
      </Button>
    </View>
  )
}
