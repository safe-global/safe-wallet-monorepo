import type { AddressBookContact } from './types'

/** Contacts whose name or address contains the query, ignoring case. */
export const filterContacts = (contacts: AddressBookContact[], query: string): AddressBookContact[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return contacts
  return contacts.filter(
    (contact) => contact.name.toLowerCase().includes(needle) || contact.address.toLowerCase().includes(needle),
  )
}
