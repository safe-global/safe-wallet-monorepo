import React from 'react'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { Text, View } from 'tamagui'
import EmptyAddressBookLight from './EmptyAddressBookLight'
import EmptyAddressBookDark from './EmptyAddressBookDark'

export const NoContactsFound = () => {
  const { isDark } = useTheme()

  const EmptyAddress = isDark ? <EmptyAddressBookDark /> : <EmptyAddressBookLight />

  return (
    <View testID="empty-token" alignItems="center" flex={1} justifyContent="center" gap="$4">
      {EmptyAddress}
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        No contacts found matching your search.
      </Text>
    </View>
  )
}
