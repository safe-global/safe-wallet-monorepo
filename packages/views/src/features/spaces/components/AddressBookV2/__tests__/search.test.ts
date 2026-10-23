import { filterByTags, searchContacts } from '../search'
import { ADDRESSES, WORKSPACE_CONTACTS } from '../mocks/fixtures'

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
