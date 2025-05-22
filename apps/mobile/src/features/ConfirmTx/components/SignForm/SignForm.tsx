import React from 'react'
import { SafeAreaView } from 'react-native'
import { View } from 'tamagui'

import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { SelectSigner } from '@/src/components/SelectSigner'
import { Address } from '@/src/types/address'

export interface SignFormProps {
  address: Address
  txId: string
}

export function SignForm({ address, txId }: SignFormProps) {
  const { isBiometricsEnabled } = useBiometrics()

  const onSignPress = () => {
    if (isBiometricsEnabled) {
      router.push({ pathname: '/sign-transaction', params: { txId, signerAddress: address } })
    } else {
      router.navigate({
        pathname: '/biometrics-opt-in',
        params: { txId, signerAddress: address, caller: '/sign-transaction' },
      })
    }
  }

  return (
    <SafeAreaView style={{ gap: 24 }}>
      <SelectSigner address={address} txId={txId} />

      <View paddingHorizontal={'$3'} height={48} gap="$2" flexDirection="row">
        <SafeButton flex={1} height="100%" onPress={onSignPress}>
          Confirm and sign
        </SafeButton>
      </View>
    </SafeAreaView>
  )
}
