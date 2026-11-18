import { useEffect } from 'react'

import { trackEvent } from '@/services/analytics'
import { WALLET_EVENTS } from '@/services/analytics/events/wallet'
import { SafeMsgEvent, safeMsgSubscribe } from '@/services/safe-messages/safeMsgEvents'

const safeMsgEvents = {
  [SafeMsgEvent.PROPOSE]: WALLET_EVENTS.SIGN_MESSAGE,
  [SafeMsgEvent.CONFIRM_PROPOSE]: WALLET_EVENTS.CONFIRM_MESSAGE,
}

export const useSafeMsgTracking = (): void => {
  useEffect(() => {
    const unsubFns = Object.entries(safeMsgEvents).map(([safeMsgEvent, analyticsEvent]) =>
      safeMsgSubscribe(safeMsgEvent as SafeMsgEvent, () => {
        trackEvent(analyticsEvent)
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [])
}
