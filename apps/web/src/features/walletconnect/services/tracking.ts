import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

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
