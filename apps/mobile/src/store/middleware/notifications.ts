import type { Middleware, AnyAction } from '@reduxjs/toolkit'
import type { RootState } from '..'
import { addSafe, removeSafe, selectAllSafes } from '../safesSlice'
import { subscribeSafe, unsubscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '../chains'
import { addDelegate } from '../delegatesSlice'
import { selectSafeSubscriptionStatus } from '../safeSubscriptionsSlice'
import { toggleAppNotifications } from '../notificationsSlice'

const notificationsMiddleware: Middleware = (store) => (next) => (action) => {
  const typedAction = action as AnyAction
  const prevState = store.getState() as RootState

  const result = next(typedAction)

  if (typedAction.type === addSafe.type) {
    const { address } = typedAction.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled
    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      subscribeSafe(store, address, chainIds)
    }
  }

  if (typedAction.type === removeSafe.type) {
    const address = typedAction.payload
    const safeInfo = prevState.safes[address]
    const chainIds = selectAllChainsIds(store.getState())

    if (safeInfo) {
      unsubscribeSafe(store, address, chainIds)
    }
  }

  if (typedAction.type === addDelegate.type) {
    const { ownerAddress, delegateInfo } = typedAction.payload
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

  const prevEnabled = prevState.notifications.isAppNotificationsEnabled
  const nextEnabled = store.getState().notifications.isAppNotificationsEnabled
  if (typedAction.type === toggleAppNotifications.type && prevEnabled !== nextEnabled) {
    const enabled = nextEnabled
    const safes = Object.values(selectAllSafes(store.getState()))
    const chainIds = selectAllChainsIds(store.getState())
    safes.forEach((safe) => {
      const safeAdress = Object.values(safe)[0].address.value
      if (enabled) {
        subscribeSafe(store, safeAdress, chainIds)
      } else {
        unsubscribeSafe(store, safeAdress, chainIds)
      }
    })
  }

  return result
}

export default notificationsMiddleware
