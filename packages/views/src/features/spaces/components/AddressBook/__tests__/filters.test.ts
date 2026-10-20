import { faker } from '@faker-js/faker'
import { countSystemTags, countTags, filterContacts, tagSortValue } from '../filters'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from '../tags/systemTags'
import { EMPTY_FILTERS, type AddressBookContact, type ContactFilters } from '../types'

const buildContact = (fields: Partial<AddressBookContact> = {}): AddressBookContact => ({
  address: faker.finance.ethereumAddress(),
  name: faker.company.name(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
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

    it('finds signers by searching for the automatic tag', () => {
      const signer = buildContact({ name: 'Maya', signerOf: ['Treasury'] })
      const other = buildContact({ name: 'Atlas' })

      expect(filterContacts([signer, other], withFilters({ query: 'signer' }))).toEqual([signer])
    })

    it('matches an automatic tag filter, ignoring case', () => {
      const safe = buildContact({ isWorkspaceSafe: true })
      const signer = buildContact({ signerOf: ['Treasury'] })
      const plain = buildContact({ tags: ['Vendor'] })
      const contacts = [safe, signer, plain]

      expect(filterContacts(contacts, withFilters({ tags: [WORKSPACE_SAFE_TAG] }))).toEqual([safe])
      expect(filterContacts(contacts, withFilters({ tags: [SIGNER_TAG.toLowerCase()] }))).toEqual([signer])
    })

    it('requires every selected tag, ignoring case', () => {
      const both = buildContact({ tags: ['Vendor', 'EU'] })
      const one = buildContact({ tags: ['Vendor'] })

      expect(filterContacts([both, one], withFilters({ tags: ['vendor', 'eu'] }))).toEqual([both])
    })

    it('ANDs search, automatic tags and team tags', () => {
      const match = buildContact({ name: 'Atlas Audits', signerOf: ['Treasury'], tags: ['Vendor'] })
      const notSigner = buildContact({ name: 'Atlas Labs', tags: ['Vendor'] })
      const wrongTag = buildContact({ name: 'Atlas Ops', signerOf: ['Treasury'], tags: ['Legal'] })

      const filters = withFilters({ query: 'atlas', tags: [SIGNER_TAG, 'Vendor'] })

      expect(filterContacts([match, notSigner, wrongTag], filters)).toEqual([match])
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

    it('leaves out the automatic tags', () => {
      const contacts = [buildContact({ isWorkspaceSafe: true, signerOf: ['Treasury'], tags: ['Vendor'] })]

      expect(countTags(contacts)).toEqual([{ tag: 'Vendor', count: 1 }])
    })

    it('returns no tags for an empty book', () => {
      expect(countTags([])).toEqual([])
    })
  })

  describe('countSystemTags', () => {
    it('counts the automatic tags in their fixed order', () => {
      const contacts = [
        buildContact({ signerOf: ['Treasury'] }),
        buildContact({ signerOf: ['Payroll', 'Ops'] }),
        buildContact({ isWorkspaceSafe: true }),
        buildContact(),
      ]

      expect(countSystemTags(contacts)).toEqual([
        { tag: WORKSPACE_SAFE_TAG, count: 1 },
        { tag: SIGNER_TAG, count: 2 },
      ])
    })

    it('leaves out an automatic tag no contact carries', () => {
      expect(countSystemTags([buildContact({ signerOf: ['Treasury'] }), buildContact()])).toEqual([
        { tag: SIGNER_TAG, count: 1 },
      ])
      expect(countSystemTags([buildContact({ tags: ['Vendor'] })])).toEqual([])
    })
  })

  describe('tagSortValue', () => {
    it('sorts workspace Safes, then signers, then team tags', () => {
      const safe = buildContact({ isWorkspaceSafe: true, tags: ['Audit'] })
      const signer = buildContact({ signerOf: ['Treasury'], tags: ['Audit'] })
      const tagged = buildContact({ tags: ['Audit'] })
      const values = [safe, signer, tagged].map(tagSortValue)

      expect(values).not.toContain(null)
      expect([...values].sort()).toEqual(values)
    })

    it('returns no value for an untagged contact so it sorts last', () => {
      expect(tagSortValue(buildContact())).toBeNull()
    })

    it('sorts team tags case-insensitively', () => {
      expect(tagSortValue(buildContact({ tags: ['Vendor'] }))).toBe(tagSortValue(buildContact({ tags: ['vendor'] })))
    })
  })
})
