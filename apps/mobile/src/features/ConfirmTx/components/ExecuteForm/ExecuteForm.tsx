import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { View } from 'tamagui'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native'

interface ExecuteFormProps {
  txId: string
}

export function ExecuteForm({ txId }: ExecuteFormProps) {
  const onExecutePress = () => {
    router.push({
      pathname: '/review-and-execute',
      params: { txId },
    })
  }

  return (
    <SafeAreaView style={{ gap: 24 }}>
      <View paddingHorizontal={'$3'} height={48} gap="$2" flexDirection="row">
        <SafeButton flex={1} height="100%" onPress={onExecutePress}>
          Continue
        </SafeButton>
      </View>
    </SafeAreaView>
  )
}
