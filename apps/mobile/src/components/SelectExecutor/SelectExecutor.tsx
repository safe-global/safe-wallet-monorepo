import React from 'react'
import { Text, View, } from 'tamagui'

import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'
import { Container } from '../Container'

type Props = {
  address: Address
  txId: string
}

export function SelectExecutor({ address, txId }: Props) {
  return (
    <View
      onPress={() =>
        router.push({ pathname: '/change-signer-sheet', params: { txId, actionType: ActionType.EXECUTE } })
      }
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={'$2'}
    >
      <Text color="$colorSecondary">Execute with</Text>

      <View
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap={'$2'}>
        <Container paddingVertical={'$2'} backgroundColor="$backgroundSecondary" paddingHorizontal={'$2'} flexDirection="row" justifyContent="center" alignItems="center" gap={'$1'}>
          <Identicon address={address} size={16} />

          <ContactDisplayNameContainer textProps={{ fontWeight: 600 }} address={address} />
        </Container>

        <SafeFontIcon name="chevron-right" />
      </View>
    </View>
  )
}
