import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { subscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '@/src/store/chains'
import { Strategy } from '@/src/store/utils/strategy/Strategy'

export class AddSafeStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: AnyAction): void {
    const { address } = action.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled
    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      subscribeSafe(store, address, chainIds)
    }
  }
}
