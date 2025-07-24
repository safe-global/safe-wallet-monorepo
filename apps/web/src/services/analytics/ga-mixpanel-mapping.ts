import { MixPanelEvent } from './mixpanel-events'

export const GA_TO_MIXPANEL_MAPPING: Record<string, string> = {
  safe_created: MixPanelEvent.SAFE_CREATED,
  'Created Safe': MixPanelEvent.SAFE_CREATED,
  safe_activated: MixPanelEvent.SAFE_ACTIVATED,
  'Activated Safe': MixPanelEvent.SAFE_ACTIVATED,
  wallet_connected: MixPanelEvent.WALLET_CONNECTED,
  'Connect wallet': MixPanelEvent.WALLET_CONNECTED,
  'Open Safe App': MixPanelEvent.SAFE_APP_LAUNCHED,
}

export const ENABLED_MIXPANEL_EVENTS = [
  MixPanelEvent.SAFE_CREATED,
  MixPanelEvent.SAFE_ACTIVATED,
  MixPanelEvent.WALLET_CONNECTED,
  MixPanelEvent.SAFE_APP_LAUNCHED,
]
