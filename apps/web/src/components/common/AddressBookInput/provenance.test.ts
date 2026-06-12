import { faker } from '@faker-js/faker'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import {
  CONTACT_RECENCY_WINDOW_DAYS,
  formatExactTime,
  formatRelativeTime,
  getProvenanceLine,
  isRecentlyAdded,
  isRecentlyChanged,
  type RecipientContact,
} from './provenance'

const DAY_MS = 24 * 60 * 60 * 1000

const contactBuilder = (overrides: Partial<RecipientContact> = {}): RecipientContact => ({
  name: faker.person.firstName(),
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

const daysAgo = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString()

describe('provenance', () => {
  describe('isRecentlyAdded', () => {
    it('returns true for a workspace contact created within the recency window', () => {
      const contact = contactBuilder({ createdAt: daysAgo(CONTACT_RECENCY_WINDOW_DAYS - 1) })
      expect(isRecentlyAdded(contact)).toBe(true)
    })

    it('returns false for a workspace contact created outside the recency window', () => {
      const contact = contactBuilder({ createdAt: daysAgo(CONTACT_RECENCY_WINDOW_DAYS + 1) })
      expect(isRecentlyAdded(contact)).toBe(false)
    })

    it('returns false for local contacts regardless of timestamp', () => {
      const contact = contactBuilder({ source: ContactSource.local, createdAt: daysAgo(1) })
      expect(isRecentlyAdded(contact)).toBe(false)
    })

    it('returns false for empty or invalid timestamps', () => {
      expect(isRecentlyAdded(contactBuilder({ createdAt: '' }))).toBe(false)
      expect(isRecentlyAdded(contactBuilder({ createdAt: 'not-a-date' }))).toBe(false)
    })
  })

  describe('isRecentlyChanged', () => {
    it('returns true when the address was changed within the recency window', () => {
      const contact = contactBuilder({ addressChangedAt: daysAgo(2) })
      expect(isRecentlyChanged(contact)).toBe(true)
    })

    it('returns false when the change is older than the recency window', () => {
      const contact = contactBuilder({ addressChangedAt: daysAgo(CONTACT_RECENCY_WINDOW_DAYS + 1) })
      expect(isRecentlyChanged(contact)).toBe(false)
    })

    it('returns false when no change timestamp is present', () => {
      expect(isRecentlyChanged(contactBuilder())).toBe(false)
    })
  })

  describe('getProvenanceLine', () => {
    it('describes a recently changed address with the editor name', () => {
      const changedAt = daysAgo(1)
      const contact = contactBuilder({ addressChangedAt: changedAt, addressChangedBy: 'franco@acme.com' })

      expect(getProvenanceLine(contact)).toEqual({
        text: 'Address changed by franco@acme.com',
        timestamp: changedAt,
      })
    })

    it('describes a recently changed address without an editor name', () => {
      const changedAt = daysAgo(1)
      const contact = contactBuilder({ addressChangedAt: changedAt })

      expect(getProvenanceLine(contact)).toEqual({ text: 'Address changed', timestamp: changedAt })
    })

    it('describes local contacts as saved on this device', () => {
      const contact = contactBuilder({ source: ContactSource.local })

      expect(getProvenanceLine(contact)).toEqual({ text: 'Saved on this device' })
    })

    it('describes workspace contacts with the creator name and timestamp', () => {
      const createdAt = daysAgo(30)
      const contact = contactBuilder({ createdBy: 'dasha@acme.com', createdAt })

      expect(getProvenanceLine(contact)).toEqual({ text: 'Added by dasha@acme.com', timestamp: createdAt })
    })

    it('returns undefined for workspace contacts without creator information', () => {
      expect(getProvenanceLine(contactBuilder())).toBeUndefined()
    })
  })

  describe('time formatting', () => {
    it('formats a relative time for valid timestamps', () => {
      expect(formatRelativeTime(daysAgo(3))).toMatch(/3 days ago/)
    })

    it('formats an exact time for valid timestamps', () => {
      const timestamp = '2026-06-06T04:30:00.000Z'
      const exact = formatExactTime(timestamp)

      expect(exact).toBe(
        new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(Date.parse(timestamp)),
      )
    })

    it('returns undefined for invalid timestamps', () => {
      expect(formatRelativeTime('not-a-date')).toBeUndefined()
      expect(formatExactTime('not-a-date')).toBeUndefined()
    })
  })
})
