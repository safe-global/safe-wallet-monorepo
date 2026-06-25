import React from 'react'
import { Text, View } from 'tamagui'

import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { router } from 'expo-router'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'
import { Container } from '../Container'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

type Props = {
  address: Address
  txId: string
  executionMethod: ExecutionMethod
  isPaidFromSafe?: boolean
}

export function SelectExecutor({ address, txId, executionMethod, isPaidFromSafe }: Props) {
  return (
    <View
      onPress={isPaidFromSafe ? undefined : () => router.push({ pathname: '/how-to-execute-sheet', params: { txId } })}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={'$2'}
      minHeight="$10"
    >
      <Text color="$colorSecondary">Pay fees from</Text>

      <View flexDirection="row" justifyContent="center" alignItems="center" gap={'$2'}>
        <Container
          paddingVertical={'$1'}
          backgroundColor="$backgroundSecondary"
          paddingHorizontal={'$2'}
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={'$1'}
        >
          {isPaidFromSafe ? (
            <Text fontWeight={600}>this Safe</Text>
          ) : executionMethod === ExecutionMethod.WITH_RELAY ? (
            <Text fontWeight={600}>Sponsored by Safe</Text>
          ) : (
            <>
              <Identicon address={address} size={16} />
              <ContactDisplayNameContainer textProps={{ fontWeight: 600 }} address={address} />
            </>
          )}
        </Container>

        {!isPaidFromSafe && <SafeFontIcon name="chevron-right" />}
      </View>
    </View>
  )
}
