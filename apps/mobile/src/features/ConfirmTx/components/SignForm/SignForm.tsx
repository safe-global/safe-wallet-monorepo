import React from 'react'
import { SafeAreaView } from 'react-native'
import { Text, View, Image } from 'tamagui'
import Signature from '@/assets/images/signature.png'

import { SafeButton } from '@/src/components/SafeButton'
import { Identicon } from '@/src/components/Identicon'
import { Address } from '@/src/types/address'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { Contact } from '@/src/features/AddressBook'

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
      <View
        onPress={() => router.push({ pathname: '/change-signer-sheet', params: { txId } })}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap={'$2'}
      >
        <Image testID="signature-button-image" width={16} height={16} source={Signature} />
        <Text fontWeight={700}>Sign with</Text>

        <Identicon address={address} size={24} />

        <Contact address={address} />

        <SafeFontIcon name="chevron-right" />
      </View>
      <View paddingHorizontal={'$3'} height={48} gap="$2" flexDirection="row">
        {/* <SafeButton flex={1} height="100%" danger onPress={() => null}>
          Reject
        </SafeButton> */}
        <SafeButton flex={1} height="100%" onPress={onSignPress}>
          Confirm and sign
        </SafeButton>
      </View>
    </SafeAreaView>
  )
}
