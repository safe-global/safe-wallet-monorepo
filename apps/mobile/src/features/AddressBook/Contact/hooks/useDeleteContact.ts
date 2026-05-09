import { useCallback } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { useAppDispatch } from '@/src/store/hooks'
import { removeContact, type Contact } from '@/src/store/addressBookSlice'

interface UseDeleteContactParams {
  contact?: Contact | null
  setIsEditing: (isEditing: boolean) => void
}

export const useDeleteContact = ({ contact, setIsEditing }: UseDeleteContactParams) => {
  const dispatch = useAppDispatch()

  const handleDeleteConfirm = useCallback(() => {
    if (!contact) {
      return
    }

    dispatch(removeContact(contact.value))
    setIsEditing(false)
    setTimeout(() => {
      router.back()
    }, 100)
  }, [contact, dispatch, setIsEditing])

  const handleDeletePress = useCallback(() => {
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
  }, [contact, handleDeleteConfirm])

  return {
    handleDeletePress,
  }
}
