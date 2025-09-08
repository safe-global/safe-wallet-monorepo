import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { View, Text, YStack } from 'tamagui'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native'
import useIsNextTx from '@/src/hooks/useIsNextTx'

interface ExecuteFormProps {
  txId: string
}

export function ExecuteForm({ txId }: ExecuteFormProps) {
  const isNext = useIsNextTx(txId)

  const onExecutePress = () => {
    router.push({
      pathname: '/review-and-execute',
      params: { txId },
    })
  }

  return (
    <SafeAreaView style={{ gap: 24 }}>
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
    </SafeAreaView>
  )
}
