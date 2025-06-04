import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { unsubscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '@/src/store/chains'
import { Strategy } from '@/src/store/utils/strategy/Strategy'

export class RemoveSafeStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: AnyAction, prevState: RootState): void {
    const address = action.payload
    const safeInfo = prevState.safes[address]
    const chainIds = selectAllChainsIds(store.getState())

    if (safeInfo) {
      unsubscribeSafe(store, address, chainIds)
    }
  }
}
