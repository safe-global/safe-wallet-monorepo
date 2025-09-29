import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { ContactFormContainer } from './ContactForm.container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { usePreventLeaveScreen } from '@/src/hooks/usePreventLeaveScreen'
import { useDeleteContact } from './hooks/useDeleteContact'
import { useEditContact } from './hooks/useEditContact'

export const ContactDetailContainer = () => {
  const { address, mode } = useLocalSearchParams<{
    address?: string
    mode?: 'view' | 'edit' | 'new'
  }>()

  const navigation = useNavigation()

  const contact = useAppSelector(selectContactByAddress(address || ''))

  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'new')
  usePreventLeaveScreen(isEditing)

  const { handleDeletePress } = useDeleteContact({ contact, setIsEditing })
  const { handleEdit, handleSave } = useEditContact({ mode, setIsEditing })

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
  }, [isEditing, contact, mode, navigation, handleDeletePress])

  return <ContactFormContainer contact={contact} isEditing={isEditing} onSave={handleSave} onEdit={handleEdit} />
}
