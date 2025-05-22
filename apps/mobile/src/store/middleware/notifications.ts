import type { Middleware, AnyAction } from '@reduxjs/toolkit'
import type { RootState } from '..'
import { addSafe, removeSafe, selectAllSafes } from '../safesSlice'
import { subscribeSafe, unsubscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '../chains'
import { addDelegate } from '../delegatesSlice'

const notificationsMiddleware: Middleware = (store) => (next) => (action) => {
  const typedAction = action as AnyAction
  const prevState = store.getState() as RootState

  const result = next(typedAction)

  if (typedAction.type === addSafe.type) {
    const { SafeInfo } = typedAction.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled
    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      subscribeSafe(SafeInfo.address.value, chainIds)
    }
  }

  if (typedAction.type === removeSafe.type) {
    const safeInfo = prevState.safes[typedAction.payload]
    const chainIds = selectAllChainsIds(store.getState())
    if (safeInfo) {
      unsubscribeSafe(safeInfo.SafeInfo.address.value, chainIds)
    }
  }

  if (typedAction.type === addDelegate.type) {
    const { ownerAddress, delegateInfo } = typedAction.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled

    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      const safes = Object.values(selectAllSafes(store.getState()))
      safes.forEach((safe) => {
        const safeAddress = safe.SafeInfo.address.value
        const owners = safe.SafeInfo.owners.map((o) => o.value)
        const isTargetSafe = delegateInfo.safe ? delegateInfo.safe === safeAddress : owners.includes(ownerAddress)

        if (isTargetSafe) {
          subscribeSafe(safeAddress, chainIds)
        }
      })
    }
  }

  const prevEnabled = prevState.notifications.isAppNotificationsEnabled
  const nextEnabled = store.getState().notifications.isAppNotificationsEnabled
  if (prevEnabled !== nextEnabled) {
    const enabled = nextEnabled
    const safes = Object.values(selectAllSafes(store.getState()))
    const chainIds = selectAllChainsIds(store.getState())
    safes.forEach((safe) => {
      if (enabled) {
        subscribeSafe(safe.SafeInfo.address.value, chainIds)
      } else {
        unsubscribeSafe(safe.SafeInfo.address.value, chainIds)
      }
    })
  }

  return result
}

export default notificationsMiddleware
