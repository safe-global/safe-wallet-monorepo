import React from 'react'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { H3, Text, View } from 'tamagui'
import EmptyAddressBookLight from './EmptyAddressBookLight'
import EmptyAddressBookDark from './EmptyAddressBookDark'

export const NoContacts = () => {
  const { isDark } = useTheme()

  const EmptyAddress = isDark ? <EmptyAddressBookDark /> : <EmptyAddressBookLight />

  return (
    <View testID="empty-token" alignItems="center" flex={1} justifyContent="center" gap="$4">
      {EmptyAddress}
      <H3 fontWeight={600}>No contacts yet</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        This account has no contacts added.
      </Text>
    </View>
  )
}
