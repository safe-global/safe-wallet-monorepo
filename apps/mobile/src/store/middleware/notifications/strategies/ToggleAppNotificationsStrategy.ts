import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { subscribeSafe, unsubscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '@/src/store/chains'
import { selectAllSafes } from '@/src/store/safesSlice'
import { Strategy } from '@/src/store/utils/strategy/Strategy'

export class ToggleAppNotificationsStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, _action: AnyAction, prevState: RootState): void {
    const prevEnabled = prevState.notifications.isAppNotificationsEnabled
    const nextEnabled = store.getState().notifications.isAppNotificationsEnabled

    if (prevEnabled === nextEnabled) {
      return
    }

    const safes = Object.values(selectAllSafes(store.getState()))
    const chainIds = selectAllChainsIds(store.getState())

    safes.forEach((safe) => {
      const safeAddress = Object.values(safe)[0].address.value
      if (nextEnabled) {
        subscribeSafe(store, safeAddress, chainIds)
      } else {
        unsubscribeSafe(store, safeAddress, chainIds)
      }
    })
  }
}
