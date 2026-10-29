import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, type WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

export const getSuggestionParams = (origin: string, safeApp: SafeAppData) => ({
  [MixpanelEventParams.APP_URL]: origin,
  [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name,
})

export const getSuggestionResultParams = (
  origin: string,
  safeApp: SafeAppData,
  result: WcSafeAppSuggestionResult,
  optOut: boolean,
) => ({
  ...getSuggestionParams(origin, safeApp),
  [MixpanelEventParams.RESULT]: result,
  [MixpanelEventParams.OPT_OUT_TICKED]: optOut,
})

const trackedRequests = [
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'wallet_sendCalls',
]

export const trackRequest = (peerUrl: string, method: string) => {
  if (trackedRequests.includes(method)) {
    trackEvent({ ...WALLETCONNECT_EVENTS.REQUEST, label: peerUrl })
  }
}
