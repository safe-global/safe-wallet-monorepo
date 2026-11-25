import { filterByTags, searchContacts, searchPendingRequests, searchSuggestions } from '../search'
import {
  ADDRESSES,
  MEMBERS,
  PENDING_REQUESTS,
  SUGGESTED_SIGNERS,
  WORKSPACE_CONTACTS,
} from '@safe-global/views/features/spaces/components/AddressBookV2/mocks/fixtures'

const names = (query: string) => searchContacts(WORKSPACE_CONTACTS, query).map((contact) => contact.name)

describe('searchContacts', () => {
  it('keeps every contact for a blank query', () => {
    expect(searchContacts(WORKSPACE_CONTACTS, '   ')).toEqual(WORKSPACE_CONTACTS)
  })

  it('matches part of the name, ignoring case', () => {
    expect(names('PAYR')).toEqual(['Payroll'])
  })

  it('matches part of the address, ignoring case', () => {
    expect(names(ADDRESSES.northwind.slice(12, 24).toUpperCase())).toEqual(['Northwind Logistics'])
  })

  it('ignores spaces around the query', () => {
    expect(names('  atlas  ')).toEqual(['Atlas Audits'])
  })

  it('keeps no contact when nothing matches', () => {
    expect(searchContacts(WORKSPACE_CONTACTS, 'no such contact')).toEqual([])
  })

  it('matches part of a tag name, ignoring case', () => {
    expect(names('VEND')).toEqual(['Northwind Logistics', 'Atlas Audits'])
  })
})

describe('filterByTags', () => {
  const tagged = (tagIds: number[]) => filterByTags(WORKSPACE_CONTACTS, tagIds).map((contact) => contact.name)

  it('keeps every contact without a selected tag', () => {
    expect(filterByTags(WORKSPACE_CONTACTS, [])).toEqual(WORKSPACE_CONTACTS)
  })

  it('keeps the contacts with the selected tag', () => {
    expect(tagged([2])).toEqual(['Northwind Logistics', 'Atlas Audits'])
  })

  it('keeps only the contacts with every selected tag', () => {
    expect(tagged([1, 3])).toEqual(['Payroll'])
  })
})

describe('searchSuggestions', () => {
  const suggested = (query: string) => searchSuggestions(SUGGESTED_SIGNERS, query).map((item) => item.suggestedName)

  it('keeps every suggestion for a blank query', () => {
    expect(searchSuggestions(SUGGESTED_SIGNERS, ' ')).toEqual(SUGGESTED_SIGNERS)
  })

  it('matches part of the suggested name, ignoring case', () => {
    expect(suggested('PAYROLL SIGNER')).toEqual(['Payroll signer 3'])
  })

  it('matches part of the address, ignoring case', () => {
    expect(suggested(SUGGESTED_SIGNERS[0].address.slice(10, 22).toLowerCase())).toEqual(['Treasury signer 4'])
  })

  it('matches every signer of a Safe', () => {
    expect(suggested('grants')).toEqual(['Ops multisig signer 2', 'Grants program signer 3'])
  })
})

describe('searchPendingRequests', () => {
  const requested = (query: string) => searchPendingRequests(PENDING_REQUESTS, query).map((request) => request.name)

  it('keeps every request for a blank query', () => {
    expect(searchPendingRequests(PENDING_REQUESTS, '')).toEqual(PENDING_REQUESTS)
  })

  it('matches part of the requested name, ignoring case', () => {
    expect(requested('VENUE')).toEqual(['Conference venue deposit'])
  })

  it('matches part of the address', () => {
    expect(requested(ADDRESSES.northwind.slice(8, 20))).toEqual(['Northwind Logistics (new invoices)'])
  })

  it('matches the member who requested it', () => {
    expect(requested(MEMBERS.jonas.toLowerCase())).toEqual(['Brightline Payroll Services'])
  })
})
