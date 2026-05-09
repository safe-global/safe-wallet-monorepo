import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React from 'react'

import { NoContacts } from './List/NoContacts'
import { View } from 'tamagui'
import SafeSearchBar from '@/src/components/SafeSearchBar/SafeSearchBar'
import { ContactItemActionsContainer } from '../ContactItemActions.container'
import { LargeHeaderTitle } from '@/src/components/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { NoContactsFound } from './List/NoContactsFound'

type Props = {
  contacts: AddressInfo[]
  filteredContacts: AddressInfo[]
  onSearch: (query: string) => void
  onSelectContact: (contact: AddressInfo) => void
  onAddContact: () => void
}

export const AddressBookListView = ({ contacts, filteredContacts, onSearch, onSelectContact, onAddContact }: Props) => {
  const insets = useSafeAreaInsets()

  return (
    <View marginTop="$2" style={{ flex: 1, marginBottom: insets.bottom }} testID={'address-book-screen'}>
      <View flex={1}>
        <View paddingHorizontal="$4">
          <LargeHeaderTitle>Address book</LargeHeaderTitle>
        </View>
        <View paddingHorizontal="$4">
          <SafeSearchBar placeholder="Name, address" onSearch={onSearch} throttleTime={300} />
        </View>
        {contacts.length === 0 && <NoContacts />}
        {contacts.length > 0 && filteredContacts.length === 0 && <NoContactsFound />}
        <ContactItemActionsContainer contacts={filteredContacts} onSelectContact={onSelectContact} />
      </View>
      {/* Add Contact Button */}
      <View paddingTop="$4" paddingHorizontal="$4">
        <SafeButton primary onPress={onAddContact}>
          Add contact
        </SafeButton>
      </View>
    </View>
  )
}
