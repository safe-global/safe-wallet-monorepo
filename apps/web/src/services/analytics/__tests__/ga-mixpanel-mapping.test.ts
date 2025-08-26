import { GA_TO_MIXPANEL_MAPPING, GA_LABEL_TO_MIXPANEL_PROPERTY } from '../ga-mixpanel-mapping'
import { MixPanelEvent } from '../mixpanel-events'
import { SWAP_EVENTS } from '../events/swaps'

describe('GA-MixPanel Mapping', () => {
  it('should map SWAP_EVENTS.OPEN_SWAPS to NATIVE_SWAP_VIEWED', () => {
    expect(GA_TO_MIXPANEL_MAPPING[SWAP_EVENTS.OPEN_SWAPS.action]).toBe(MixPanelEvent.NATIVE_SWAP_VIEWED)
  })

  it('should include all expected event mappings', () => {
    expect(GA_TO_MIXPANEL_MAPPING).toHaveProperty(SWAP_EVENTS.OPEN_SWAPS.action)
    expect(GA_TO_MIXPANEL_MAPPING[SWAP_EVENTS.OPEN_SWAPS.action]).toBe('Native Swap Viewed')
  })

  it('should map GA labels to MixPanel properties correctly', () => {
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['home']).toBe('Home')
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['assets']).toBe('Assets')
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['asset']).toBe('Assets')
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['dashboard_assets']).toBe('Home')
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['sidebar']).toBe('Sidebar')
    expect(GA_LABEL_TO_MIXPANEL_PROPERTY['newTransaction']).toBe('New Transaction')
  })
})
