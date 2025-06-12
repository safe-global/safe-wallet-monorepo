import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy } from '@/src/store/utils/strategy/Strategy'
import { createSafeAddedEvent, createSafeRemovedEvent } from '@/src/services/analytics/events/safes'
import { trackEvent } from '@/src/services/analytics/firebaseAnalytics'
import { selectTotalSafeCount } from '@/src/store/safesSlice'

export class SafeManagementStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: AnyAction, _prevState: RootState): void {
    try {
      if (action.type === 'safes/addSafe') {
        // Calculate total safe count after the action is applied
        const currentState = store.getState()
        const totalSafeCount = selectTotalSafeCount(currentState)

        const event = createSafeAddedEvent(totalSafeCount)
        trackEvent(event)
      } else if (action.type === 'safes/removeSafe') {
        // Calculate total safe count after the action is applied
        const currentState = store.getState()
        const totalSafeCount = selectTotalSafeCount(currentState)

        const event = createSafeRemovedEvent(totalSafeCount)
        trackEvent(event)
      }
    } catch (error) {
      console.error('Error tracking safe management event:', error)
    }
  }
}
