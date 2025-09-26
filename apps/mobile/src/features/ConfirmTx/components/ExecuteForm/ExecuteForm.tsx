import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { View, Text, YStack, getTokenValue } from 'tamagui'
import { router } from 'expo-router'
import useIsNextTx from '@/src/hooks/useIsNextTx'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ExecuteFormProps {
  txId: string
}

export function ExecuteForm({ txId }: ExecuteFormProps) {
  const { bottom } = useSafeAreaInsets()
  const isNext = useIsNextTx(txId)

  const onExecutePress = () => {
    router.push({
      pathname: '/review-and-execute',
      params: { txId },
    })
  }

  return (
    <View gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <View paddingHorizontal={'$3'} gap="$2" flexDirection="row">
        <YStack justifyContent="center" gap="$2" width="100%">
          {!isNext && (
            <Text
              fontSize="$4"
              fontWeight={400}
              width="70%"
              alignSelf="center"
              textAlign="center"
              color="$textSecondaryLight"
            >
              You must execute the transaction with the lowest nonce first.
            </Text>
          )}
          <SafeButton onPress={onExecutePress} disabled={!isNext}>
            Continue
          </SafeButton>
        </YStack>
      </View>
    </View>
  )
}
