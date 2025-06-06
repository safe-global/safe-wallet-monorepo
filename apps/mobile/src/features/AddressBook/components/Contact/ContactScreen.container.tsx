import React, { useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { selectContactByAddress, addContact, updateContact, type Contact } from '@/src/store/addressBookSlice'
import { ContactView } from './ContactView'

export const ContactScreenContainer = () => {
  const { address } = useLocalSearchParams<{ address?: string }>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const contact = useAppSelector(address ? selectContactByAddress(address) : () => null)
  const [isEditing, setIsEditing] = useState(!address) // Start in edit mode if no address (new contact)

  const isNew = !contact

  const handleSave = (contactData: Contact) => {
    if (isNew) {
      dispatch(addContact(contactData))
    } else {
      dispatch(updateContact(contactData))
    }

    setIsEditing(false)

    if (isNew) {
      router.replace('/address-book')
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? 'New contact' : isEditing ? 'Edit contact' : contact?.name || 'Contact',
        }}
      />

      <ContactView contact={contact} isEditing={isEditing} onSave={handleSave} onEdit={handleEdit} />
    </>
  )
}
