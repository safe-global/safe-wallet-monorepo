import { MixPanelEvent } from './mixpanel-events'
import { CREATE_SAFE_EVENTS } from './events/createLoadSafe'
import { WALLET_EVENTS } from './events/wallet'
import { SAFE_APPS_EVENTS } from './events/safeApps'
import { POSITIONS_EVENTS } from './events/positions'
import { STAKE_EVENTS } from './events/stake'
import { EARN_EVENTS } from './events/earn'
import { WALLETCONNECT_EVENTS } from './events/walletconnect'
import { TX_LIST_EVENTS } from './events/txList'

// If an event is mapped here, it will be tracked in Mixpanel
export const GA_TO_MIXPANEL_MAPPING: Record<string, string> = {
  [CREATE_SAFE_EVENTS.CREATED_SAFE.action]: MixPanelEvent.SAFE_CREATED,
  [CREATE_SAFE_EVENTS.ACTIVATED_SAFE.action]: MixPanelEvent.SAFE_ACTIVATED,
  [WALLET_EVENTS.CONNECT.action]: MixPanelEvent.WALLET_CONNECTED,
  [SAFE_APPS_EVENTS.OPEN_APP.action]: MixPanelEvent.SAFE_APP_LAUNCHED,
  [POSITIONS_EVENTS.POSITION_EXPANDED.action]: MixPanelEvent.POSITION_EXPANDED,
  [POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED.action]: MixPanelEvent.POSITIONS_VIEW_ALL_CLICKED,
  [POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED.action]: MixPanelEvent.EMPTY_POSITIONS_EXPLORE_CLICKED,
  [STAKE_EVENTS.STAKE_VIEWED.action]: MixPanelEvent.STAKE_VIEWED,
  [EARN_EVENTS.EARN_VIEWED.action]: MixPanelEvent.EARN_VIEWED,
  [WALLETCONNECT_EVENTS.CONNECTED.action]: MixPanelEvent.WC_CONNECTED,
  [TX_LIST_EVENTS.CSV_EXPORT_CLICKED.action]: MixPanelEvent.CSV_TX_EXPORT_CLICKED,
  [TX_LIST_EVENTS.CSV_EXPORT_SUBMITTED.action]: MixPanelEvent.CSV_TX_EXPORT_SUBMITTED,
}
