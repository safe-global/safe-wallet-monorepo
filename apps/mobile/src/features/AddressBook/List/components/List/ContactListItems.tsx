import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useCallback } from 'react'
import { FlashList } from '@shopify/flash-list'
import { getTokenValue } from 'tamagui'
import { ContactItem } from './ContactItem'

interface ContactListItemsProps {
  contacts: AddressInfo[]
  onSelectContact: (contact: AddressInfo) => void
  onMenuAction: (contact: AddressInfo, actionId: string) => void
  menuActions: {
    id: string
    title: string
    image?: string
    imageColor?: string
    attributes?: { destructive?: boolean }
  }[]
}

export const ContactListItems: React.FC<ContactListItemsProps> = ({
  contacts,
  onSelectContact,
  onMenuAction,
  menuActions,
}) => {
  const renderContact = useCallback(
    ({ item }: { item: AddressInfo }) => (
      <ContactItem
        contact={item}
        onPress={() => onSelectContact(item)}
        onMenuAction={onMenuAction}
        menuActions={menuActions}
      />
    ),
    [onSelectContact, onMenuAction, menuActions],
  )

  const keyExtractor = useCallback((item: AddressInfo) => item.value, [])

  if (contacts.length === 0) {
    return null
  }

  return (
    <FlashList
      data={contacts}
      renderItem={renderContact}
      estimatedItemSize={200}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingHorizontal: getTokenValue('$2') }}
    />
  )
}
