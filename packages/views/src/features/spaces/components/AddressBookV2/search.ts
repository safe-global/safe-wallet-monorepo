import type { AddressBookContact } from './types'

export const searchContacts = (contacts: AddressBookContact[], query: string): AddressBookContact[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return contacts
  return contacts.filter(
    (contact) => contact.name.toLowerCase().includes(needle) || contact.address.toLowerCase().includes(needle),
  )
}
