import { MiddlewareAPI, Dispatch } from '@reduxjs/toolkit'
import { SafeInfo } from '@/src/types/address'
import { trackEvent } from '@/src/services/analytics'
import { EventType } from '@/src/services/analytics/types'
import type { RootState } from '@/src/store'
import { Strategy, ActionWithPayload } from '@/src/store/utils/strategy/Strategy'

export class SafeViewedStrategy implements Strategy<RootState> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: ActionWithPayload, _prevState: RootState): void {
    // Track safe_viewed when activeSafe is set with a safe (not null/cleared)
    if (action.type === 'activeSafe/setActiveSafe' && action.payload !== null) {
      const safeInfo = action.payload as SafeInfo

      trackEvent({
        eventName: EventType.SAFE_OPENED,
        eventCategory: 'safe',
        eventAction: 'opened',
        eventLabel: 'safe_viewed',
        chainId: safeInfo.chainId,
      }).catch((error) => {
        console.error('[SafeViewedStrategy] Error tracking safe_viewed event:', error)
      })
    }

    // Track safe_viewed when switching chains (since this changes the safe context)
    if (action.type === 'activeSafe/switchActiveChain') {
      // Get the current state (after the action has been applied)
      const currentState = store.getState()
      const safeInfo = currentState.activeSafe

      if (safeInfo) {
        trackEvent({
          eventName: EventType.SAFE_OPENED,
          eventCategory: 'safe',
          eventAction: 'opened',
          eventLabel: 'safe_viewed',
          chainId: safeInfo.chainId,
        }).catch((error) => {
          console.error('[SafeViewedStrategy] Error tracking safe_viewed event on chain switch:', error)
        })
      }
    }
  }
}
