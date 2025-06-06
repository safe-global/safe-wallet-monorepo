import React from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { ContactDetailContainer } from '@/src/features/AddressBook'

function ContactScreen() {
  const { mode } = useLocalSearchParams<{ mode?: 'view' | 'edit' | 'new' }>()

  const getTitle = () => {
    switch (mode) {
      case 'new':
        return 'New contact'
      case 'edit':
        return 'Edit contact'
      case 'view':
      default:
        return 'Contact'
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: getTitle() }} />
      <ContactDetailContainer />
    </>
  )
}

export default ContactScreen
