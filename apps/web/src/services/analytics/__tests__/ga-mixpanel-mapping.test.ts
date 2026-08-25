import { GA_TO_MIXPANEL_MAPPING, GA_LABEL_TO_MIXPANEL_PROPERTY } from '../ga-mixpanel-mapping'
import { MixpanelEvent } from '../mixpanel-events'
import { SWAP_EVENTS } from '../events/swaps'
import { SPACE_EVENTS } from '../events/spaces'

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

    it.each([
      [SPACE_EVENTS.DELETE_SPACE.action, MixpanelEvent.WORKSPACE_DELETED],
      [SPACE_EVENTS.LEAVE_SPACE.action, MixpanelEvent.WORKSPACE_LEFT],
      [SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED.action, MixpanelEvent.WORKSPACE_MEMBER_INVITE_RENEWED],
      [SPACE_EVENTS.ADD_ACCOUNTS.action, MixpanelEvent.WORKSPACE_ACCOUNTS_ADDED],
      [SPACE_EVENTS.ADD_ACCOUNT_MANUALLY.action, MixpanelEvent.WORKSPACE_ACCOUNT_ADDED_MANUALLY],
      [SPACE_EVENTS.DELETE_ACCOUNT.action, MixpanelEvent.WORKSPACE_ACCOUNT_DELETED],
      [SPACE_EVENTS.CREATE_SPACE_TX.action, MixpanelEvent.WORKSPACE_SEND_TX_STARTED],
      [SPACE_EVENTS.EDIT_ADDRESS_SUBMIT.action, MixpanelEvent.WORKSPACE_ADDRESS_EDITED],
      [SPACE_EVENTS.REMOVE_ADDRESS_SUBMIT.action, MixpanelEvent.WORKSPACE_ADDRESS_REMOVED],
      [SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT.action, MixpanelEvent.WORKSPACE_ADDRESS_BOOK_IMPORTED],
      [SPACE_EVENTS.WORKSPACE_UPDATED.action, MixpanelEvent.WORKSPACE_UPDATED],
      [SPACE_EVENTS.SECURITY_HUB_VIEWED.action, MixpanelEvent.SECURITY_HUB_VIEWED],
      [SPACE_EVENTS.SECURITY_REPORT_OPENED.action, MixpanelEvent.SECURITY_REPORT_OPENED],
      [SPACE_EVENTS.ACTIVITY_LOG_VIEWED.action, MixpanelEvent.ACTIVITY_LOG_VIEWED],
      [SPACE_EVENTS.ACTIVITY_LOG_FILTERED.action, MixpanelEvent.ACTIVITY_LOG_FILTERED],
      [SPACE_EVENTS.ADDRESS_REQUEST_SENT.action, MixpanelEvent.WORKSPACE_ADDRESS_REQUEST_SENT],
      [SPACE_EVENTS.ADDRESS_REQUEST_APPROVED.action, MixpanelEvent.WORKSPACE_ADDRESS_REQUEST_APPROVED],
      [SPACE_EVENTS.ADDRESS_REQUEST_REJECTED.action, MixpanelEvent.WORKSPACE_ADDRESS_REQUEST_REJECTED],
      [SPACE_EVENTS.LOCAL_CONTACT_ADDED.action, MixpanelEvent.WORKSPACE_LOCAL_CONTACT_ADDED],
    ])('should map "%s" to "%s"', (action, mixpanelEvent) => {
      expect(GA_TO_MIXPANEL_MAPPING[action]).toBe(mixpanelEvent)
    })

    // The mapping is keyed by the GA action string, so two events sharing an action
    // silently overwrite each other's Mixpanel destination.
    it('should have a unique action string per space event', () => {
      const actions = Object.values(SPACE_EVENTS).map((event) => event.action)
      expect(new Set(actions).size).toBe(actions.length)
    })

    it('should only map to known Mixpanel events', () => {
      const knownEvents = new Set<string>(Object.values(MixpanelEvent))
      Object.values(GA_TO_MIXPANEL_MAPPING).forEach((mixpanelEvent) => {
        expect(knownEvents).toContain(mixpanelEvent)
      })
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
