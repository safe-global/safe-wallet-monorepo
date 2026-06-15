import type { AddressBookState } from '@/store/addressBookSlice'
import type { ContactItem } from './Import/ContactsList'
import type { ImportContactsFormValues } from './Import/ImportAddressBookDialog'
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

// Mirrors the CGW name schema for space address book entries (makeNameSchema,
// ADDRESS_BOOK_NAME_MAX_LENGTH). Local contacts are unrestricted, so names are
// validated before they are proposed to the workspace.
const CONTACT_NAME_REGEX = /^[a-zA-Z0-9]+(?:[ ._-][a-zA-Z0-9]+)*$/
const CONTACT_NAME_MIN_LENGTH = 3
const CONTACT_NAME_MAX_LENGTH = 50

export const validateContactName = (name: string): string | undefined => {
  const trimmed = name.trim()
  if (trimmed.length < CONTACT_NAME_MIN_LENGTH || trimmed.length > CONTACT_NAME_MAX_LENGTH) {
    return `Names must be ${CONTACT_NAME_MIN_LENGTH} to ${CONTACT_NAME_MAX_LENGTH} characters long`
  }
  if (!CONTACT_NAME_REGEX.test(trimmed)) {
    return 'Names must start with a letter or number and can contain alphanumeric characters, spaces, periods, underscores, or hyphens'
  }
}
