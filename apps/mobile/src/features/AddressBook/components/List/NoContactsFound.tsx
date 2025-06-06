import React from 'react'
import { useColorScheme } from 'react-native'
import { Text, View } from 'tamagui'
import EmptyAddressBookLight from './EmptyAddressBookLight'
import EmptyAddressBookDark from './EmptyAddressBookDark'

export const NoContactsFound = () => {
  const colorScheme = useColorScheme()

  const EmptyAddress = colorScheme === 'dark' ? <EmptyAddressBookDark /> : <EmptyAddressBookLight />

  return (
    <View testID="empty-token" alignItems="center" flex={1} justifyContent="center" gap="$4">
      {EmptyAddress}
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        No contacts found matching your search.
      </Text>
    </View>
  )
}
