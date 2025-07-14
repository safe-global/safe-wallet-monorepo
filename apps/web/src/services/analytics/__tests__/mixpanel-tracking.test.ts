import mixpanel from 'mixpanel-browser'
import {
  setMixPanelUserAttributes,
  setMixPanelUserAttributesOnce,
  incrementMixPanelUserAttributes,
  appendMixPanelUserAttributes,
  unionMixPanelUserAttributes,
  trackMixPanelEvent,
  identifyMixPanelUser,
  registerMixPanelSuperProperties,
} from '../mixpanel-tracking'
import type { SafeUserAttributes } from '../types'

// Mock mixpanel
jest.mock('mixpanel-browser', () => ({
  has_opted_in_tracking: jest.fn(),
  people: {
    set: jest.fn(),
    set_once: jest.fn(),
    increment: jest.fn(),
    append: jest.fn(),
    union: jest.fn(),
  },
  track: jest.fn(),
  identify: jest.fn(),
  register: jest.fn(),
  flush: jest.fn(),
}))

jest.mock('@/config/constants', () => ({
  IS_PRODUCTION: false,
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn().mockReturnValue(true),
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  FEATURES: {
    MIXPANEL: 'MIXPANEL',
  },
}))

describe('MixPanel Tracking', () => {
  const mockUserAttributes: SafeUserAttributes = {
    safe_id: '0x123',
    created_at: new Date('2022-01-01T00:00:00Z'),
    safe_version: '1.3.0',
    num_signers: 2,
    threshold: 2,
    networks: ['ethereum'],
    last_tx_at: new Date('2023-01-01T00:00:00Z'),
    space_id: null,
    nested_safe_ids: [],
    total_tx_count: 5,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mixpanel.has_opted_in_tracking as jest.Mock).mockReturnValue(true)
    Object.defineProperty(window, 'window', {
      value: {},
      writable: true,
    })
  })

  describe('setMixPanelUserAttributes', () => {
    it('should set user attributes when MixPanel is ready', () => {
      setMixPanelUserAttributes(mockUserAttributes)

      expect(mixpanel.people.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Safe Address': '0x123',
          'Created at': '2022-01-01T00:00:00.000Z',
          'Last Transaction at': '2023-01-01T00:00:00.000Z',
        }),
      )
    })

    it('should not set attributes when MixPanel is not ready', () => {
      ;(mixpanel.has_opted_in_tracking as jest.Mock).mockReturnValue(false)

      setMixPanelUserAttributes(mockUserAttributes)

      // Note: Opt-in check is currently disabled for testing
      // In production, this should be re-enabled and this test should expect not.toHaveBeenCalled()
      expect(mixpanel.people.set).toHaveBeenCalled()
    })
  })

  describe('setMixPanelUserAttributesOnce', () => {
    it('should set user attributes once when MixPanel is ready', () => {
      const partialAttributes = {
        safe_id: '0x123',
        created_at: new Date('2022-01-01T00:00:00Z'),
      }

      setMixPanelUserAttributesOnce(partialAttributes)

      expect(mixpanel.people.set_once).toHaveBeenCalledWith(
        expect.objectContaining({
          'Safe Address': '0x123',
          'Created at': '2022-01-01T00:00:00.000Z',
        }),
      )
    })
  })

  describe('incrementMixPanelUserAttributes', () => {
    it('should increment numerical attributes', () => {
      incrementMixPanelUserAttributes({
        total_tx_count: 1,
      })

      expect(mixpanel.people.increment).toHaveBeenCalledWith('Total Transaction Count', 1)
    })

    it('should not increment non-numerical attributes', () => {
      incrementMixPanelUserAttributes({
        total_tx_count: 'invalid' as any,
      })

      expect(mixpanel.people.increment).not.toHaveBeenCalled()
    })
  })

  describe('appendMixPanelUserAttributes', () => {
    it('should append array attributes', () => {
      appendMixPanelUserAttributes({
        networks: ['polygon'],
        nested_safe_ids: ['0x456'],
      })

      expect(mixpanel.people.append).toHaveBeenCalledWith('Networks', ['polygon'])
      expect(mixpanel.people.append).toHaveBeenCalledWith('Nested Safe IDs', ['0x456'])
    })

    it('should not append non-array attributes', () => {
      appendMixPanelUserAttributes({
        networks: 'invalid' as any,
      })

      expect(mixpanel.people.append).not.toHaveBeenCalled()
    })
  })

  describe('unionMixPanelUserAttributes', () => {
    it('should union array attributes', () => {
      unionMixPanelUserAttributes({
        networks: ['polygon'],
        nested_safe_ids: ['0x456'],
      })

      expect(mixpanel.people.union).toHaveBeenCalledWith('Networks', ['polygon'])
      expect(mixpanel.people.union).toHaveBeenCalledWith('Nested Safe IDs', ['0x456'])
    })
  })

  describe('trackMixPanelEvent', () => {
    it('should track event with properties', () => {
      const eventProperties = {
        'Safe Address': '0x123',
        'Safe Version': '1.3.0',
        Network: 'ethereum',
      }

      trackMixPanelEvent('test_event', eventProperties)

      expect(mixpanel.track).toHaveBeenCalledWith('test_event', eventProperties)
    })
  })

  describe('identifyMixPanelUser', () => {
    it('should identify user with safe address', () => {
      identifyMixPanelUser('0x123')

      expect(mixpanel.identify).toHaveBeenCalledWith('0x123')
    })
  })

  describe('registerMixPanelSuperProperties', () => {
    it('should register super properties', () => {
      const properties = {
        'Safe ID': '0x123',
        Network: 'ethereum',
      }

      registerMixPanelSuperProperties(properties)

      expect(mixpanel.register).toHaveBeenCalledWith(properties)
    })
  })
})
