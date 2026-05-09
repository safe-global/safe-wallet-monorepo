import { useCallback } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllContacts, addContact, updateContact, type Contact } from '@/src/store/addressBookSlice'

interface UseEditContactParams {
  mode?: 'view' | 'edit' | 'new'
  setIsEditing: (isEditing: boolean) => void
}

export const useEditContact = ({ mode, setIsEditing }: UseEditContactParams) => {
  const dispatch = useAppDispatch()
  const allContacts = useAppSelector(selectAllContacts)

  const findExistingContact = useCallback(
    (contactAddress: string) => {
      return allContacts.find((c) => c.value === contactAddress)
    },
    [allContacts],
  )

  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [setIsEditing])

  const handleSave = useCallback(
    (contactToSave: Contact) => {
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
    },
    [mode, findExistingContact, dispatch, setIsEditing],
  )

  return {
    handleEdit,
    handleSave,
  }
}
