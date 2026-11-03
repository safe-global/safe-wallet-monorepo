import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, type WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

export const getSuggestionParams = (origin: string, safeApp: SafeAppData) => ({
  [MixpanelEventParams.APP_URL]: origin,
  [MixpanelEventParams.SAFE_APP_NAME]: safeApp.name,
})

/** The suggestion-result event, as `trackEvent` arguments or as `Track` props */
export const getSuggestionResultEvent = (
  origin: string,
  safeApp: SafeAppData,
  { result, remember }: { result: WcSafeAppSuggestionResult; remember: boolean },
) => ({
  event: { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: origin },
  params: {
    ...getSuggestionParams(origin, safeApp),
    [MixpanelEventParams.RESULT]: result,
    [MixpanelEventParams.REMEMBER_CHOICE]: remember,
  },
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
