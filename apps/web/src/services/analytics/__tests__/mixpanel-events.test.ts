import { MixpanelEvent, MixpanelUserProperty, MixpanelEventParams, ADDRESS_PROPERTIES } from '../mixpanel-events'

describe('Mixpanel Events', () => {
  describe('MixpanelEvent enum', () => {
    it('should contain NATIVE_SWAP_VIEWED event', () => {
      expect(MixpanelEvent.NATIVE_SWAP_VIEWED).toBe('Native Swap Viewed')
    })

    it('should contain all expected events', () => {
      const expectedEvents = [
        'SAFE_APP_LAUNCHED',
        'SAFE_CREATED',
        'SAFE_ACTIVATED',
        'WALLET_CONNECTED',
        'POSITION_EXPANDED',
        'POSITIONS_VIEW_ALL_CLICKED',
        'EMPTY_POSITIONS_EXPLORE_CLICKED',
        'STAKE_VIEWED',
        'EARN_VIEWED',
        'WC_CONNECTED',
        'CSV_TX_EXPORT_CLICKED',
        'CSV_TX_EXPORT_SUBMITTED',
        'NATIVE_SWAP_VIEWED',
      ]

      expectedEvents.forEach((eventKey) => {
        expect(MixpanelEvent[eventKey as keyof typeof MixpanelEvent]).toBeDefined()
      })
    })
  })

  describe('ADDRESS_PROPERTIES set', () => {
    it('should contain expected address properties', () => {
      expect(ADDRESS_PROPERTIES.has(MixpanelEventParams.SAFE_ADDRESS)).toBe(true)
      expect(ADDRESS_PROPERTIES.has(MixpanelEventParams.EOA_WALLET_ADDRESS)).toBe(true)
      expect(ADDRESS_PROPERTIES.has(MixpanelUserProperty.SAFE_ADDRESS)).toBe(true)
    })

    it('should have correct size', () => {
      expect(ADDRESS_PROPERTIES.size).toBe(2)
    })
  })
})
