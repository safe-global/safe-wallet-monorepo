import type { AddressBookState } from '@/store/addressBookSlice'
import type { ContactItem } from './Import/ContactsList'
import type { ImportContactsFormValues } from './Import/ImportAddressBookDialog'
import type { AddressBookItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  ADDRESS_BOOK_NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  sanitizeName,
  validateName,
} from '@safe-global/utils/validation/names'

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

// Local contacts are unrestricted, so names are validated against the shared workspace
// name schema before they can be proposed to the workspace.
export const validateContactName = (name: string): string | undefined =>
  validateName(sanitizeName(name), { minLength: NAME_MIN_LENGTH, maxLength: ADDRESS_BOOK_NAME_MAX_LENGTH })
