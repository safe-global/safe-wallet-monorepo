import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useCallback, useState } from 'react'

import { NoContacts } from './components/List/NoContacts'
import { View } from 'tamagui'
import SafeSearchBar from '@/src/components/SafeSearchBar/SafeSearchBar'
import { AddressBookList } from './components/List/AddressBookList'
import { LargeHeaderTitle } from '@/src/components/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  contacts: AddressInfo[]
}

export const AddressBookView = ({ contacts }: Props) => {
  const insets = useSafeAreaInsets()
  const [filteredContacts, setFilteredContacts] = useState<AddressInfo[]>(contacts)

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredContacts(contacts)
        return
      }

      const lowercaseQuery = query.toLowerCase()
      const filtered = contacts.filter((contact) => {
        const matchesName = contact.name?.toLowerCase().includes(lowercaseQuery)
        const matchesAddress = contact.value.toLowerCase().includes(lowercaseQuery)
        return matchesName || matchesAddress
      })

      setFilteredContacts(filtered)
    },
    [contacts],
  )
  return (
    <View
      paddingHorizontal="$4"
      marginTop="$2"
      style={{ flex: 1, marginBottom: insets.bottom }}
      testID={'address-book-screen'}
    >
      <LargeHeaderTitle>Address book</LargeHeaderTitle>
      <SafeSearchBar placeholder="Name, address" onSearch={handleSearch} throttleTime={300} />
      {contacts.length === 0 && <NoContacts />}
      <AddressBookList
        contacts={filteredContacts}
        onSelectContact={() => console.log('waiting on details page to implement route to it')}
      />
    </View>
  )
}
