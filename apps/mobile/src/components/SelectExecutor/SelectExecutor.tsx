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
  isSafePays?: boolean
}

export function SelectExecutor({ address, txId, executionMethod, isSafePays }: Props) {
  return (
    <View
      onPress={isSafePays ? undefined : () => router.push({ pathname: '/how-to-execute-sheet', params: { txId } })}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={'$2'}
      minHeight={40}
    >
      <Text color="$colorSecondary">Execution method</Text>

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
          {isSafePays ? (
            <Text fontWeight={600}>Pay fees from this Safe</Text>
          ) : executionMethod === ExecutionMethod.WITH_RELAY ? (
            <Text fontWeight={600}>Sponsored by Safe</Text>
          ) : (
            <>
              <Identicon address={address} size={16} />
              <ContactDisplayNameContainer textProps={{ fontWeight: 600 }} address={address} />
            </>
          )}
        </Container>

        {!isSafePays && <SafeFontIcon name="chevron-right" />}
      </View>
    </View>
  )
}
