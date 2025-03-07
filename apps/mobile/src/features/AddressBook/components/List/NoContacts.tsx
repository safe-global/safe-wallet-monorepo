import React from 'react'
import { useColorScheme } from 'react-native'
import { H3, Text, View } from 'tamagui'
import EmptyAddressBookLight from './EmptyAddressBookLight'
import EmptyAddressBookDark from './EmptyAddressBookDark'

export const NoContacts = () => {
  const colorScheme = useColorScheme()

  const EmptyAddress = colorScheme === 'dark' ? <EmptyAddressBookDark /> : <EmptyAddressBookLight />

  return (
    <View testID="empty-token" alignItems="center" gap="$4">
      {EmptyAddress}
      <H3 fontWeight={600}>No contacts yet</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        This account has no contacts added.
      </Text>
    </View>
  )
}
