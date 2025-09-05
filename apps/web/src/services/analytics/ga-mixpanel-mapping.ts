import { MixpanelEvent } from './mixpanel-events'
import { CREATE_SAFE_EVENTS } from './events/createLoadSafe'
import { WALLET_EVENTS } from './events/wallet'
import { SAFE_APPS_EVENTS } from './events/safeApps'
import { POSITIONS_EVENTS } from './events/positions'
import { STAKE_EVENTS } from './events/stake'
import { EARN_EVENTS } from './events/earn'
import { WALLETCONNECT_EVENTS } from './events/walletconnect'
import { TX_LIST_EVENTS } from './events/txList'
import { SWAP_EVENTS } from './events/swaps'

// If an event is mapped here, it will be tracked in Mixpanel
export const GA_TO_MIXPANEL_MAPPING: Record<string, string> = {
  [CREATE_SAFE_EVENTS.CREATED_SAFE.action]: MixpanelEvent.SAFE_CREATED,
  [CREATE_SAFE_EVENTS.ACTIVATED_SAFE.action]: MixpanelEvent.SAFE_ACTIVATED,
  [WALLET_EVENTS.CONNECT.action]: MixpanelEvent.WALLET_CONNECTED,
  [SAFE_APPS_EVENTS.OPEN_APP.action]: MixpanelEvent.SAFE_APP_LAUNCHED,
  [POSITIONS_EVENTS.POSITION_EXPANDED.action]: MixpanelEvent.POSITION_EXPANDED,
  [POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED.action]: MixpanelEvent.POSITIONS_VIEW_ALL_CLICKED,
  [POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED.action]: MixpanelEvent.EMPTY_POSITIONS_EXPLORE_CLICKED,
  [STAKE_EVENTS.STAKE_VIEWED.action]: MixpanelEvent.STAKE_VIEWED,
  [EARN_EVENTS.EARN_VIEWED.action]: MixpanelEvent.EARN_VIEWED,
  [WALLETCONNECT_EVENTS.CONNECTED.action]: MixpanelEvent.WC_CONNECTED,
  [TX_LIST_EVENTS.CSV_EXPORT_CLICKED.action]: MixpanelEvent.CSV_TX_EXPORT_CLICKED,
  [TX_LIST_EVENTS.CSV_EXPORT_SUBMITTED.action]: MixpanelEvent.CSV_TX_EXPORT_SUBMITTED,
  [SWAP_EVENTS.OPEN_SWAPS.action]: MixpanelEvent.NATIVE_SWAP_VIEWED,
}

// Maps GA labels (lowercase) to Mixpanel properties (Title Case)
export const GA_LABEL_TO_MIXPANEL_PROPERTY: Record<string, string> = {
  asset: 'Assets',
  dashboard_assets: 'Home',
  sidebar: 'Sidebar',
  newTransaction: 'New Transaction',
}
