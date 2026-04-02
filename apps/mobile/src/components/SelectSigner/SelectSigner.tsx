import React from 'react'
import { Text, View, XStack } from 'tamagui'

import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'

type Props = {
  address: Address
  txId: string
  disabled?: boolean
}

export function SelectSigner({ address, txId, disabled = false }: Props) {
  return (
    <View alignItems="center">
      <XStack
        onPress={() => {
          if (disabled) {
            return
          }
          router.push({ pathname: '/change-signer-sheet', params: { txId, actionType: ActionType.SIGN } })
        }}
        alignItems="center"
        gap="$2"
        backgroundColor="$backgroundSkeleton"
        borderRadius={32}
        paddingHorizontal="$3"
        paddingVertical="$1"
        opacity={disabled ? 0.5 : 1}
      >
        <Text color="$colorSecondary" fontSize="$4" letterSpacing={0.17}>
          Sign with:
        </Text>

        <XStack alignItems="center" gap="$1">
          <Identicon address={address} size={24} />
          <ContactDisplayNameContainer address={address} />
          <SafeFontIcon name="chevron-down" size={16} />
        </XStack>
      </XStack>
    </View>
  )
}
