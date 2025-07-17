import React from 'react'
import { SafeAreaView } from 'react-native'
import { View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'
import { Address } from '@/src/types/address'

export interface SignFormProps {
  address: Address
  txId: string
}

export function SignForm({ address, txId }: SignFormProps) {
  const onSignPress = () => {
    router.push({
      pathname: '/review-and-confirm',
      params: { txId, signerAddress: address },
    })
  }

  return (
    <SafeAreaView style={{ gap: 24 }}>
      <View paddingHorizontal={'$3'} height={48} gap="$2" flexDirection="row">
        <SafeButton flex={1} height="100%" onPress={onSignPress}>
          Continue
        </SafeButton>
      </View>
    </SafeAreaView>
  )
}
