import React, { useCallback } from 'react'
import { Alert } from 'react-native'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch } from '@/src/store/hooks'
import { removeContact } from '@/src/store/addressBookSlice'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useContactActions } from './hooks/useContactActions'
import { ContactListItems } from './components/List/ContactListItems'

interface ContactItemActionsContainerProps {
  contacts: AddressInfo[]
  onSelectContact: (contact: AddressInfo) => void
}

export const ContactItemActionsContainer: React.FC<ContactItemActionsContainerProps> = ({
  contacts,
  onSelectContact,
}) => {
  const dispatch = useAppDispatch()
  const copy = useCopyAndDispatchToast()
  const actions = useContactActions()

  const handleDeleteContact = useCallback(
    (contact: AddressInfo) => {
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
            onPress: () => {
              dispatch(removeContact(contact.value))
            },
          },
        ],
        { cancelable: true },
      )
    },
    [dispatch],
  )

  const handleCopyContact = useCallback(
    (contact: AddressInfo) => {
      copy(contact.value as string)
    },
    [copy],
  )

  const handleMenuAction = useCallback(
    (contact: AddressInfo, actionId: string) => {
      if (actionId === 'copy') {
        return handleCopyContact(contact)
      }

      if (actionId === 'delete') {
        return handleDeleteContact(contact)
      }
    },
    [handleCopyContact, handleDeleteContact],
  )

  return (
    <ContactListItems
      contacts={contacts}
      onSelectContact={onSelectContact}
      onMenuAction={handleMenuAction}
      menuActions={actions}
    />
  )
}
