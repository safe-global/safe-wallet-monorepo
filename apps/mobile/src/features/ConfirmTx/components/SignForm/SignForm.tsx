import React from 'react'
import { Text, View, YStack, Image } from 'tamagui'

import { SafeButton } from '@/src/components/SafeButton'
import { Identicon } from '@/src/components/Identicon'
import { Address } from '@/src/types/address'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import Signature from '@/assets/images/signature.png'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'
export interface SignFormProps {
  address: Address
  name?: string
  txId: string
}

export function SignForm({ address, name, txId }: SignFormProps) {
  const { isBiometricsEnabled } = useBiometrics()

  const onSignPress = () => {
    if (isBiometricsEnabled) {
      router.push({ pathname: '/sign-transaction', params: { txId, signerAddress: address } })
    } else {
      router.push({
        pathname: '/biometrics-opt-in',
        params: { txId, signerAddress: address, caller: '/sign-transaction' },
      })
    }
  }

  return (
    <YStack gap="$6">
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

        {name ? <Text fontWeight={500}>{name}</Text> : <EthAddress address={address} />}

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
    </YStack>
  )
}
