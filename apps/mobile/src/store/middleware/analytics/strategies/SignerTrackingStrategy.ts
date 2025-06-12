import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy, ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { trackEvent } from '@/src/services/analytics'
import { createSignerAddedEvent } from '@/src/services/analytics/events/signers'
import { selectTotalSignerCount } from '@/src/store/signersSlice'

/**
 * Strategy to track signer addition events
 * Tracks when signers are added to the app and includes total signer count
 */
export class SignerTrackingStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: ActionWithPayload): void {
    // Check if this is a signer addition action
    if (action.type === 'signers/addSigner') {
      this.trackSignerAddition(store.getState())
    }
  }

  private trackSignerAddition(state: RootState): void {
    try {
      const totalSignerCount = selectTotalSignerCount(state)
      trackEvent(createSignerAddedEvent(totalSignerCount)).catch((error) => {
        console.error('[SignerTrackingStrategy] Error tracking signer addition event:', error)
      })
    } catch (error) {
      console.error('[SignerTrackingStrategy] Error in trackSignerAddition:', error)
    }
  }
}
