import React from 'react'
import { View } from 'tamagui'
import { SectionTitle } from '@/src/components/Title'

interface AddressBookListHeaderProps {
  sectionTitle?: string
}

export function AddressBookListHeader({ sectionTitle }: AddressBookListHeaderProps) {
  return (
    <View gap="$6">
      <SectionTitle paddingHorizontal={'$0'} title={sectionTitle || 'Address Book'} />
    </View>
  )
}
