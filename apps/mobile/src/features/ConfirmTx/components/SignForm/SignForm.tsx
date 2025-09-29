import React from 'react'
import { getTokenValue, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface SignFormProps {
  txId: string
}

export function SignForm({ txId }: SignFormProps) {
  const { bottom } = useSafeAreaInsets()
  const onSignPress = () => {
    router.push({
      pathname: '/review-and-confirm',
      params: { txId },
    })
  }

  return (
    <View gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <View paddingHorizontal={'$3'} height={48} gap="$2" flexDirection="row">
        <SafeButton flex={1} height="100%" onPress={onSignPress}>
          Continue
        </SafeButton>
      </View>
    </View>
  )
}
