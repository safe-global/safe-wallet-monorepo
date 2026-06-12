import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ContactSource, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { formatExactTime, formatRelativeTime, getProvenanceLine } from './provenance'

const contactBuilder = (overrides: Partial<ExtendedContact> = {}): ExtendedContact => ({
  name: 'Test Contact',
  address: checksumAddress(faker.finance.ethereumAddress()),
  chainIds: ['1'],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
  source: ContactSource.space,
  ...overrides,
})

describe('getProvenanceLine', () => {
  it('returns a device line for local contacts', () => {
    const contact = contactBuilder({ source: ContactSource.local })

    expect(getProvenanceLine(contact)).toEqual({ text: 'Saved on this device' })
  })

  it('returns undefined for a space contact without a creator', () => {
    const contact = contactBuilder({ createdBy: '' })

    expect(getProvenanceLine(contact)).toBeUndefined()
  })

  it('prefers the space member name as the actor', () => {
    const creator = checksumAddress(faker.finance.ethereumAddress())
    const contact = contactBuilder({ createdBy: creator, createdAt: '2026-01-01T00:00:00Z' })

    const line = getProvenanceLine(contact, 'Alice', () => 'Address book name')

    expect(line).toEqual({ text: 'Added by', actor: 'Alice', timestamp: '2026-01-01T00:00:00Z' })
  })

  it('falls back to the resolved address book name when there is no member name', () => {
    const creator = checksumAddress(faker.finance.ethereumAddress())
    const contact = contactBuilder({ createdBy: creator })

    const line = getProvenanceLine(contact, undefined, (address) => (address === creator ? 'Bob' : ''))

    expect(line?.actor).toBe('Bob')
  })

  it('falls back to the raw creator value when nothing resolves', () => {
    const creator = checksumAddress(faker.finance.ethereumAddress())
    const contact = contactBuilder({ createdBy: creator })

    expect(getProvenanceLine(contact)?.actor).toBe(creator)
  })

  it('omits the timestamp when createdAt is empty', () => {
    const contact = contactBuilder({ createdBy: checksumAddress(faker.finance.ethereumAddress()), createdAt: '' })

    expect(getProvenanceLine(contact)?.timestamp).toBeUndefined()
  })
})

describe('formatRelativeTime / formatExactTime', () => {
  it('returns undefined for unparseable timestamps', () => {
    expect(formatRelativeTime('not-a-date')).toBeUndefined()
    expect(formatExactTime('not-a-date')).toBeUndefined()
  })

  it('formats valid timestamps', () => {
    const timestamp = new Date().toISOString()

    expect(formatRelativeTime(timestamp)).toEqual(expect.any(String))
    expect(formatExactTime(timestamp)).toEqual(expect.any(String))
  })
})
