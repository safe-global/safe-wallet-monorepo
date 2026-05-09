import { faker } from '@faker-js/faker'
import { parseNotification } from './notificationParser'

jest.mock('@/src/store/utils/singletonStore', () => ({
  getStore: jest.fn(() => ({
    getState: jest.fn(() => ({
      chains: {
        data: {
          '1': {
            chainId: '1',
            chainName: 'Ethereum',
            nativeCurrency: { symbol: 'ETH', decimals: 18 },
          },
          '137': {
            chainId: '137',
            chainName: 'Polygon',
            nativeCurrency: { symbol: 'POL', decimals: 18 },
          },
        },
      },
    })),
  })),
}))

jest.mock('@/src/store/chains', () => ({
  selectChainById: jest.fn((state, chainId) => state.chains.data[chainId] || null),
}))

jest.mock('@/src/store/addressBookSlice', () => ({
  selectContactByAddress: jest.fn(() => () => null),
}))

jest.mock('./store-sync/read', () => ({
  getExtensionData: jest.fn(() => null),
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('parseNotification', () => {
  const address = faker.finance.ethereumAddress()

  describe('returns null for invalid data', () => {
    it('returns null when data is undefined', () => {
      const result = parseNotification(undefined)
      expect(result).toBeNull()
    })

    it('returns null when data has no type', () => {
      const result = parseNotification({ chainId: '1' })
      expect(result).toBeNull()
    })

    it('returns null for unknown notification type', () => {
      const result = parseNotification({
        type: 'UNKNOWN_TYPE',
        chainId: '1',
        address,
      })
      expect(result).toBeNull()
    })
  })

  describe('INCOMING_ETHER', () => {
    it('parses incoming ether notification with value', () => {
      const result = parseNotification({
        type: 'INCOMING_ETHER',
        chainId: '1',
        address,
        value: '1000000000000000000',
      })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Incoming ETH (Ethereum)')
      expect(result?.body).toContain('1.0')
      expect(result?.body).toContain('ETH received')
    })

    it('parses incoming ether on Polygon', () => {
      const result = parseNotification({
        type: 'INCOMING_ETHER',
        chainId: '137',
        address,
        value: '2500000000000000000',
      })

      expect(result?.title).toBe('Incoming POL (Polygon)')
      expect(result?.body).toContain('2.5')
      expect(result?.body).toContain('POL received')
    })

    it('handles missing value gracefully', () => {
      const result = parseNotification({
        type: 'INCOMING_ETHER',
        chainId: '1',
        address,
      })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Incoming ETH (Ethereum)')
      expect(result?.body).toContain('ETH received')
    })

    it('uses fallback chain name for unknown chain', () => {
      const result = parseNotification({
        type: 'INCOMING_ETHER',
        chainId: '999999',
        address,
        value: '1000000000000000000',
      })

      expect(result?.title).toContain('Chain Id 999999')
    })
  })

  describe('INCOMING_TOKEN', () => {
    it('parses incoming token notification', () => {
      const result = parseNotification({
        type: 'INCOMING_TOKEN',
        chainId: '1',
        address,
      })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Incoming token (Ethereum)')
      expect(result?.body).toContain('tokens received')
    })

    it('parses incoming token on different chain', () => {
      const result = parseNotification({
        type: 'INCOMING_TOKEN',
        chainId: '137',
        address,
      })

      expect(result?.title).toBe('Incoming token (Polygon)')
    })
  })

  describe('EXECUTED_MULTISIG_TRANSACTION', () => {
    it('parses successful transaction notification', () => {
      const result = parseNotification({
        type: 'EXECUTED_MULTISIG_TRANSACTION',
        chainId: '1',
        address,
        failed: 'false',
      })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Transaction successful (Ethereum)')
      expect(result?.body).toContain('Transaction successful')
    })

    it('parses failed transaction notification', () => {
      const result = parseNotification({
        type: 'EXECUTED_MULTISIG_TRANSACTION',
        chainId: '1',
        address,
        failed: 'true',
      })

      expect(result?.title).toBe('Transaction failed (Ethereum)')
      expect(result?.body).toContain('Transaction failed')
    })
  })

  describe('CONFIRMATION_REQUEST', () => {
    it('parses confirmation request notification', () => {
      const result = parseNotification({
        type: 'CONFIRMATION_REQUEST',
        chainId: '1',
        address,
      })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Confirmation required (Ethereum)')
      expect(result?.body).toContain('requires your confirmation')
    })
  })

  describe('address formatting', () => {
    it('shortens address when no contact name is found', () => {
      const result = parseNotification({
        type: 'INCOMING_ETHER',
        chainId: '1',
        address: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      })

      expect(result?.body).toContain('0x1234...7890')
    })

    it('handles empty address', () => {
      const result = parseNotification({
        type: 'INCOMING_TOKEN',
        chainId: '1',
        address: '',
      })

      expect(result).not.toBeNull()
    })
  })
})
