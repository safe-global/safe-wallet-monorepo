import { GA_TO_MIXPANEL_MAPPING, GA_LABEL_TO_MIXPANEL_PROPERTY } from '../ga-mixpanel-mapping'
import { MixpanelEvent } from '../mixpanel-events'
import { SWAP_EVENTS } from '../events/swaps'

describe('GA to Mixpanel Mapping', () => {
  describe('GA_TO_MIXPANEL_MAPPING', () => {
    it('should map swap events correctly', () => {
      expect(GA_TO_MIXPANEL_MAPPING[SWAP_EVENTS.OPEN_SWAPS.action]).toBe(MixpanelEvent.NATIVE_SWAP_VIEWED)
    })

    it('should contain all expected swap mappings', () => {
      const swapMapping = GA_TO_MIXPANEL_MAPPING[SWAP_EVENTS.OPEN_SWAPS.action]
      expect(swapMapping).toBeDefined()
      expect(typeof swapMapping).toBe('string')
    })
  })

  describe('GA_LABEL_TO_MIXPANEL_PROPERTY', () => {
    it('should contain newTransaction mapping', () => {
      expect(GA_LABEL_TO_MIXPANEL_PROPERTY.newTransaction).toBe('New Transaction')
    })

    it('should contain expected label mappings', () => {
      expect(GA_LABEL_TO_MIXPANEL_PROPERTY.asset).toBe('Assets')
      expect(GA_LABEL_TO_MIXPANEL_PROPERTY.dashboard_assets).toBe('Home')
      expect(GA_LABEL_TO_MIXPANEL_PROPERTY.sidebar).toBe('Sidebar')
    })

    it('should have consistent mapping format', () => {
      Object.entries(GA_LABEL_TO_MIXPANEL_PROPERTY).forEach(([gaLabel, mixpanelProperty]) => {
        expect(typeof gaLabel).toBe('string')
        expect(typeof mixpanelProperty).toBe('string')
        // Mixpanel props should start with uppercase
        expect(mixpanelProperty[0]).toBe(mixpanelProperty[0].toUpperCase())
      })
    })
  })
})
