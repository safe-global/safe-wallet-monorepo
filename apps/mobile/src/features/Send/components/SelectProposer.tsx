import React from 'react'
import { Text, View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { Address } from '@/src/types/address'

interface SelectProposerProps {
  address: Address
  showChevron: boolean
  onPress: () => void
}

export function SelectProposer({ address, showChevron, onPress }: SelectProposerProps) {
  return (
    <View
      onPress={showChevron ? onPress : undefined}
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="$2"
    >
      <Text fontWeight={700}>Propose with</Text>

      <Identicon address={address} size={24} />

      <ContactDisplayNameContainer address={address} />

      {showChevron && <SafeFontIcon name="chevron-down" />}
    </View>
  )
}
