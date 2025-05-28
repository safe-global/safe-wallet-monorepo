import { AnyAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { subscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '@/src/store/chains'
import { selectAllSafes } from '@/src/store/safesSlice'
import { selectSafeSubscriptionStatus } from '@/src/store/safeSubscriptionsSlice'
import { Strategy } from '@/src/store/utils/strategy/Strategy'

export class AddDelegateStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(store: MiddlewareAPI<Dispatch, RootState>, action: AnyAction): void {
    const { ownerAddress, delegateInfo } = action.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled

    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      const safes = selectAllSafes(store.getState())
      const state = store.getState()

      Object.entries(safes).forEach(([safeAddress, chainDeployments]) => {
        // Get all owners across all chain deployments
        const allOwners = new Set<string>()
        Object.values(chainDeployments).forEach((deployment) => {
          deployment.owners.forEach((owner) => allOwners.add(owner.value))
        })

        const isTargetSafe = delegateInfo.safe ? delegateInfo.safe === safeAddress : allOwners.has(ownerAddress)

        if (isTargetSafe) {
          // Only subscribe if the Safe is already subscribed for notifications on at least one chain
          const isSafeSubscribedOnAnyChain = chainIds.some(
            (chainId) => selectSafeSubscriptionStatus(state, safeAddress, chainId) !== false,
          )

          if (isSafeSubscribedOnAnyChain) {
            subscribeSafe(store, safeAddress, chainIds)
          }
        }
      })
    }
  }
}
