import type { AddressBookState } from '@/store/addressBookSlice'
import type { ContactItem } from '@/features/spaces/components/SpaceAddressBook/Import/ContactsList'
import type { ImportContactsFormValues } from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'
import type { AddressBookItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export const flattenAddressBook = (allAddressBooks: AddressBookState): ContactItem[] => {
  return Object.entries(allAddressBooks).flatMap(([chainId, addressBook]) => {
    return Object.entries(addressBook).map(([address, name]) => ({
      chainId,
      address,
      name,
    }))
  })
}

export const createContactItems = (data: ImportContactsFormValues) => {
  return Object.entries(data.contacts)
    .map(([contactItemId, name]) => {
      const [chainId, address] = contactItemId.split(':')
      if (!name) return

      return {
        chainIds: [chainId],
        address,
        name,
      }
    })
    .filter(Boolean) as AddressBookItem[]
}

export const getSelectedAddresses = (contacts: ImportContactsFormValues['contacts']) => {
  const selectedAddresses = new Set<string>()

  Object.entries(contacts).forEach(([contactId, contactName]) => {
    if (contactName) {
      const [, address] = contactId.split(':')
      selectedAddresses.add(address)
    }
  })

  return selectedAddresses
}

export const getContactId = (contact: ContactItem) => {
  return `${contact.chainId}:${contact.address}`
}
