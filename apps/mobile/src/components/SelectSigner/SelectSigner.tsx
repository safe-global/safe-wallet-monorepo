import React from 'react'
import { Text, View, Image } from 'tamagui'
import Signature from '@/assets/images/signature.png'

import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'

type Props = {
  address: Address
  txId: string
}

export function SelectSigner({ address, txId }: Props) {
  return (
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

      <ContactDisplayNameContainer address={address} />

      <SafeFontIcon name="chevron-right" />
    </View>
  )
}
