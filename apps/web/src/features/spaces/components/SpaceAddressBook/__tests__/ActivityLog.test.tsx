import { render, screen } from '@testing-library/react'
import ActivityLog, { formatDate, buildActivityEvents } from '../ActivityLog'
import type { AddressBookEntry } from '../SpaceAddressBookTable'
import { faker } from '@faker-js/faker'

jest.mock('@/components/common/Identicon', () => {
  const Identicon = ({ address }: { address: string }) => <span data-testid="identicon">{address}</span>
  return Identicon
})
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = ({ address }: { address: string }) => <span data-testid="eth-hash-info">{address}</span>
  return EthHashInfo
})
jest.mock('@/components/common/InitialsAvatar', () => {
  const InitialsAvatar = ({ name }: { name: string }) => <span data-testid="initials-avatar" data-name={name} />
  return InitialsAvatar
})

const makeEntry = (overrides: Partial<AddressBookEntry> = {}): AddressBookEntry => ({
  name: 'Alice',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainIds: ['1'],
  createdBy: '0xaaaa',
  createdByUserId: 1,
  lastUpdatedBy: '0xbbbb',
  lastUpdatedByUserId: 2,
  createdAt: '',
  updatedAt: '',
  isLocal: false,
  ...overrides,
})

describe('ActivityLog', () => {
  describe('formatDate', () => {
    it('returns empty string for empty input', () => {
      expect(formatDate('')).toBe('')
    })

    it('returns empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('')
    })

    it('formats today as "Today at HH:MM"', () => {
      const now = new Date()
      const result = formatDate(now.toISOString())
      expect(result).toMatch(/^Today at /)
    })

    it('formats yesterday as "Yesterday at HH:MM"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatDate(yesterday.toISOString())
      expect(result).toMatch(/^Yesterday at /)
    })

    it('formats older dates as "Mon DD at HH:MM"', () => {
      const result = formatDate('2025-01-15T10:30:00Z')
      expect(result).toMatch(/at /)
      expect(result).not.toMatch(/^Today/)
      expect(result).not.toMatch(/^Yesterday/)
    })
  })

  describe('buildActivityEvents', () => {
    it('returns empty array for empty entries', () => {
      expect(buildActivityEvents([])).toEqual([])
    })

    it('returns empty array when entries have no createdAt', () => {
      const entry = makeEntry()
      expect(buildActivityEvents([entry])).toEqual([])
    })

    it('creates an "added" event for an entry with createdAt', () => {
      const entry = makeEntry({ createdAt: '2025-01-01T10:00:00Z' })
      const events = buildActivityEvents([entry])

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('added')
      expect(events[0].actor.value).toBe('0xaaaa')
      expect(events[0].date).toBe('2025-01-01T10:00:00Z')
    })

    it('creates both "added" and "updated" events when updatedAt differs from createdAt', () => {
      const entry = makeEntry({
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-02T12:00:00Z',
      })
      const events = buildActivityEvents([entry])

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('updated')
      expect(events[0].actor.value).toBe('0xbbbb')
      expect(events[1].type).toBe('added')
      expect(events[1].actor.value).toBe('0xaaaa')
    })

    it('does not create "updated" event when updatedAt equals createdAt', () => {
      const entry = makeEntry({
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
      })
      const events = buildActivityEvents([entry])

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('added')
    })

    it('sorts events newest first', () => {
      const entries = [
        makeEntry({
          name: 'Older',
          address: '0x1111',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        makeEntry({
          name: 'Newer',
          address: '0x2222',
          createdAt: '2025-06-15T10:00:00Z',
        }),
      ]
      const events = buildActivityEvents(entries)

      expect(events).toHaveLength(2)
      expect(events[0].entry.name).toBe('Newer')
      expect(events[1].entry.name).toBe('Older')
    })

    it('interleaves added and updated events by date', () => {
      const entries = [
        makeEntry({
          name: 'First',
          address: '0x1111',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-03-01T10:00:00Z',
        }),
        makeEntry({
          name: 'Second',
          address: '0x2222',
          createdAt: '2025-02-01T10:00:00Z',
        }),
      ]
      const events = buildActivityEvents(entries)

      expect(events).toHaveLength(3)
      expect(events[0]).toMatchObject({ type: 'updated', entry: { name: 'First' } })
      expect(events[1]).toMatchObject({ type: 'added', entry: { name: 'Second' } })
      expect(events[2]).toMatchObject({ type: 'added', entry: { name: 'First' } })
    })
  })

  describe('rendering', () => {
    it('renders Identicon + EthHashInfo when actor is an address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const entry = makeEntry({ createdBy: address, createdAt: '2025-01-01T10:00:00Z' })

      render(<ActivityLog entries={[entry]} />)

      expect(screen.getByTestId('identicon')).toHaveTextContent(address)
      expect(screen.getByTestId('eth-hash-info')).toHaveTextContent(address)
      expect(screen.queryByTestId('initials-avatar')).not.toBeInTheDocument()
    })

    it('renders InitialsAvatar + plain email when actor is an email', () => {
      const email = faker.internet.email()
      const entry = makeEntry({ createdBy: email, createdAt: '2025-01-01T10:00:00Z' })

      render(<ActivityLog entries={[entry]} />)

      expect(screen.getByTestId('initials-avatar')).toHaveAttribute('data-name', email)
      expect(screen.getByText(email)).toBeInTheDocument()
      expect(screen.queryByTestId('identicon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('eth-hash-info')).not.toBeInTheDocument()
    })

    it('renders empty state when no events', () => {
      render(<ActivityLog entries={[]} />)
      expect(screen.getByText('No activity yet.')).toBeInTheDocument()
    })
  })
})
