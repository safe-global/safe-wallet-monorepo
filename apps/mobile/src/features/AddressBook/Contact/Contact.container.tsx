import React, { useState, useEffect, useCallback } from 'react'
import { useLocalSearchParams, router, useNavigation } from 'expo-router'
import { Alert, TouchableOpacity } from 'react-native'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  selectContactByAddress,
  selectAllContacts,
  addContact,
  updateContact,
  removeContact,
  type Contact,
} from '@/src/store/addressBookSlice'
import { ContactView } from './components/ContactView'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { usePreventLeaveScreen } from '@/src/hooks/usePreventLeaveScreen'

export const ContactContainer = () => {
  const { address, mode } = useLocalSearchParams<{
    address?: string
    mode?: 'view' | 'edit' | 'new'
  }>()

  const navigation = useNavigation()
  const dispatch = useAppDispatch()

  const contact = useAppSelector(selectContactByAddress(address || ''))
  const allContacts = useAppSelector(selectAllContacts)

  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'new')
  usePreventLeaveScreen(isEditing)

  // Set up navigation header with delete button when editing existing contact
  useEffect(() => {
    if (isEditing && contact && mode !== 'new') {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={handleDeletePress} style={{ marginRight: 4 }}>
            <SafeFontIcon name="delete" size={24} color="$error" />
          </TouchableOpacity>
        ),
      })
    } else {
      navigation.setOptions({
        headerRight: undefined,
      })
    }
  }, [isEditing, contact, mode, navigation])

  const findExistingContact = useCallback(
    (contactAddress: string) => {
      return allContacts.find((c) => c.value === contactAddress)
    },
    [allContacts],
  )

  const handleDeletePress = () => {
    if (!contact) {
      return
    }

    Alert.alert(
      'Delete Contact',
      'Do you really want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDeleteConfirm,
        },
      ],
      { cancelable: true },
    )
  }

  const handleDeleteConfirm = () => {
    if (!contact) {
      return
    }

    dispatch(removeContact(contact.value))
    setIsEditing(false)
    setTimeout(() => {
      router.back()
    }, 100)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = (contactToSave: Contact) => {
    if (mode === 'new') {
      // Check if a contact with this address already exists
      const existingContact = findExistingContact(contactToSave.value)

      if (existingContact) {
        Alert.alert(
          'Contact Already Exists',
          `A contact with this address already exists: "${existingContact.name}". Do you want to update the existing contact?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Update Existing',
              onPress: () => {
                dispatch(updateContact(contactToSave))
                setIsEditing(false)
                router.setParams({
                  address: contactToSave.value,
                  mode: 'view',
                })
              },
            },
          ],
          { cancelable: true },
        )
        return
      }

      dispatch(addContact(contactToSave))
      setIsEditing(false)
      // Update the URL parameters to reflect that we're now viewing an existing contact
      router.setParams({
        address: contactToSave.value,
        mode: 'view',
      })
    } else {
      dispatch(updateContact(contactToSave))
      setIsEditing(false)
    }
  }

  return <ContactView contact={contact} isEditing={isEditing} onSave={handleSave} onEdit={handleEdit} />
}
