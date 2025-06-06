import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useCallback, useState, useMemo } from 'react'
import { router } from 'expo-router'

import { NoContacts } from './components/List/NoContacts'
import { View } from 'tamagui'
import SafeSearchBar from '@/src/components/SafeSearchBar/SafeSearchBar'
import { AddressBookList } from './components/List/AddressBookList'
import { LargeHeaderTitle } from '@/src/components/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { NoContactsFound } from './components/List/NoContactsFound'

type Props = {
  contacts: AddressInfo[]
}

export const AddressBookView = ({ contacts }: Props) => {
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')

  // Memoized filtered contacts for performance
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts
    }

    const lowercaseQuery = searchQuery.toLowerCase()
    return contacts.filter((contact) => {
      const matchesName = contact.name?.toLowerCase().includes(lowercaseQuery)
      const matchesAddress = contact.value.toLowerCase().includes(lowercaseQuery)
      return matchesName || matchesAddress
    })
  }, [contacts, searchQuery])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleSelectContact = useCallback((contact: AddressInfo) => {
    router.push({
      pathname: '/contact',
      params: {
        address: contact.value,
        mode: 'view',
      },
    })
  }, [])

  const handleAddContact = useCallback(() => {
    router.push({
      pathname: '/contact',
      params: {
        mode: 'new',
      },
    })
  }, [])

  return (
    <View marginTop="$2" style={{ flex: 1, marginBottom: insets.bottom }} testID={'address-book-screen'}>
      <View flex={1}>
        <View paddingHorizontal="$4">
          <LargeHeaderTitle>Address book</LargeHeaderTitle>
        </View>
        <View paddingHorizontal="$4">
          <SafeSearchBar placeholder="Name, address" onSearch={handleSearch} throttleTime={300} />
        </View>
        {contacts.length === 0 && <NoContacts />}
        {contacts.length > 0 && filteredContacts.length === 0 && <NoContactsFound />}
        <AddressBookList contacts={filteredContacts} onSelectContact={handleSelectContact} />
      </View>
      {/* Add Contact Button */}
      <View paddingTop="$4" paddingHorizontal="$4">
        <SafeButton primary onPress={handleAddContact}>
          Add contact
        </SafeButton>
      </View>
    </View>
  )
}
