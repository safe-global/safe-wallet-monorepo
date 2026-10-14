import { faker } from '@faker-js/faker'
import { categoryValues, countCategories, countTags, filterContacts } from '../filters'
import { EMPTY_FILTERS, type AddressBookContact, type ContactFilters } from '../types'

const buildContact = (fields: Partial<AddressBookContact> = {}): AddressBookContact => ({
  address: faker.finance.ethereumAddress(),
  name: faker.company.name(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  category: 'eoa',
  signerOf: [],
  tags: [],
  ...fields,
})

const withFilters = (filters: Partial<ContactFilters>): ContactFilters => ({ ...EMPTY_FILTERS, ...filters })

describe('filters', () => {
  describe('filterContacts', () => {
    it('returns every contact when no filter is set', () => {
      const contacts = [buildContact(), buildContact()]

      expect(filterContacts(contacts, EMPTY_FILTERS)).toEqual(contacts)
    })

    it('searches name, address and tags case-insensitively', () => {
      const byName = buildContact({ name: 'Northwind Studio' })
      const byAddress = buildContact({ address: '0xAbCdEf0000000000000000000000000000000001' })
      const byTag = buildContact({ tags: ['Payroll'] })
      const other = buildContact({ name: 'Atlas', address: '0x1111111111111111111111111111111111111111' })
      const contacts = [byName, byAddress, byTag, other]

      expect(filterContacts(contacts, withFilters({ query: '  NORTHWIND ' }))).toEqual([byName])
      expect(filterContacts(contacts, withFilters({ query: 'abcdef' }))).toEqual([byAddress])
      expect(filterContacts(contacts, withFilters({ query: 'payroll' }))).toEqual([byTag])
    })

    it('ORs the selected categories', () => {
      const safe = buildContact({ category: 'safe' })
      const contract = buildContact({ category: 'contract' })
      const eoa = buildContact({ category: 'eoa' })

      expect(filterContacts([safe, contract, eoa], withFilters({ categories: ['safe', 'contract'] }))).toEqual([
        safe,
        contract,
      ])
    })

    it('matches the signer category for contacts that sign a workspace Safe', () => {
      const signer = buildContact({ category: 'eoa', signerOf: ['Treasury'] })
      const eoa = buildContact({ category: 'eoa' })

      expect(filterContacts([signer, eoa], withFilters({ categories: ['signer'] }))).toEqual([signer])
    })

    it('requires every selected tag, ignoring case', () => {
      const both = buildContact({ tags: ['Vendor', 'EU'] })
      const one = buildContact({ tags: ['Vendor'] })

      expect(filterContacts([both, one], withFilters({ tags: ['vendor', 'eu'] }))).toEqual([both])
    })

    it('ANDs search, category and tags', () => {
      const match = buildContact({ name: 'Atlas Audits', category: 'contract', tags: ['Vendor'] })
      const wrongCategory = buildContact({ name: 'Atlas Labs', category: 'eoa', tags: ['Vendor'] })
      const wrongTag = buildContact({ name: 'Atlas Ops', category: 'contract', tags: ['Legal'] })

      const filters = withFilters({ query: 'atlas', categories: ['contract'], tags: ['Vendor'] })

      expect(filterContacts([match, wrongCategory, wrongTag], filters)).toEqual([match])
    })
  })

  describe('categoryValues', () => {
    it('returns the category alone for a non-signer', () => {
      expect(categoryValues(buildContact({ category: 'contract' }))).toEqual(['contract'])
    })

    it('adds signer when the contact signs a workspace Safe', () => {
      expect(categoryValues(buildContact({ category: 'eoa', signerOf: ['Payroll'] }))).toEqual(['eoa', 'signer'])
    })

    it('leaves out a category that is still loading', () => {
      expect(categoryValues(buildContact({ category: 'loading' }))).toEqual([])
      expect(categoryValues(buildContact({ category: 'loading', signerOf: ['Ops'] }))).toEqual(['signer'])
    })
  })

  describe('countTags', () => {
    it('orders tags by count, then alphabetically', () => {
      const contacts = [
        buildContact({ tags: ['Vendor', 'Legal'] }),
        buildContact({ tags: ['Vendor', 'EU'] }),
        buildContact({ tags: ['Audit'] }),
      ]

      expect(countTags(contacts)).toEqual([
        { tag: 'Vendor', count: 2 },
        { tag: 'Audit', count: 1 },
        { tag: 'EU', count: 1 },
        { tag: 'Legal', count: 1 },
      ])
    })

    it('merges tags that differ only in case and keeps the first spelling', () => {
      const contacts = [buildContact({ tags: ['Vendor'] }), buildContact({ tags: ['vendor'] })]

      expect(countTags(contacts)).toEqual([{ tag: 'Vendor', count: 2 }])
    })

    it('returns no tags for an empty book', () => {
      expect(countTags([])).toEqual([])
    })
  })

  describe('countCategories', () => {
    it('counts each category and signers on top of their category', () => {
      const contacts = [
        buildContact({ category: 'eoa', signerOf: ['Treasury'] }),
        buildContact({ category: 'eoa' }),
        buildContact({ category: 'safe' }),
        buildContact({ category: 'unknown' }),
        buildContact({ category: 'loading' }),
      ]

      const counts = countCategories(contacts)

      expect(counts.get('eoa')).toBe(2)
      expect(counts.get('signer')).toBe(1)
      expect(counts.get('safe')).toBe(1)
      expect(counts.get('unknown')).toBe(1)
      expect(counts.has('contract')).toBe(false)
    })
  })
})
