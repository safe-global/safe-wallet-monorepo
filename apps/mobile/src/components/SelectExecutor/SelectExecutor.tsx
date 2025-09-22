import React from 'react'
import { Text, View, Stack, YStack, XStack } from 'tamagui'

import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'
import { Tag } from '@/src/components/Tag'

type Props = {
  address: Address
  txId: string
}

export function SelectExecutor({ address, txId }: Props) {
  // TODO: Use this for gas estimation
  //const gasLimit = useGasLimit(txId)

  return (
    <Stack
      onPress={() =>
        router.push({ pathname: '/change-signer-sheet', params: { txId, actionType: ActionType.EXECUTE } })
      }
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
      marginHorizontal="$4"
      marginBottom="$2"
      borderRadius={8}
      space="$3"
    >
      <View flexDirection="row" justifyContent="space-between" alignItems="center" gap={'$2'}>
        <YStack>
          <Text fontWeight={700}>Execution method</Text>
          <Text>Est. fee</Text>
        </YStack>

        <XStack alignItems="center">
          <Tag grey>
            <Identicon address={address} size={16} />
            <ContactDisplayNameContainer address={address} />
          </Tag>

          <SafeFontIcon name="chevron-right" />
        </XStack>
      </View>
    </Stack>
  )
}
