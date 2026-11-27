import type {
  AddressBookContact,
  PendingRequest,
  SuggestedContact,
} from '@safe-global/views/features/spaces/components/AddressBookV2/types'

/** Keeps the items with a field that contains the query, ignoring case and surrounding spaces. */
const searchBy = <T>(items: T[], query: string, fieldsOf: (item: T) => Array<string | undefined>): T[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter((item) => fieldsOf(item).some((field) => field?.toLowerCase().includes(needle)))
}

export const searchContacts = (contacts: AddressBookContact[], query: string): AddressBookContact[] =>
  searchBy(contacts, query, (contact) => [
    contact.name,
    contact.address,
    ...(contact.tags ?? []).map((tag) => tag.name),
  ])

export const searchSuggestions = (suggestions: SuggestedContact[], query: string): SuggestedContact[] =>
  searchBy(suggestions, query, (item) => [item.suggestedName, item.address, ...item.reason.safes])

export const searchPendingRequests = (requests: PendingRequest[], query: string): PendingRequest[] =>
  searchBy(requests, query, (request) => [request.name, request.address, request.requestedBy])

/** A contact must have every selected tag. */
export const filterByTags = (contacts: AddressBookContact[], tagIds: number[]): AddressBookContact[] =>
  tagIds.length === 0
    ? contacts
    : contacts.filter((contact) => tagIds.every((id) => contact.tags?.some((tag) => tag.id === id)))
