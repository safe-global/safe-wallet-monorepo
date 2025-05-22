import { Middleware } from '@reduxjs/toolkit'
import { RootState } from '..'
import { addSafe, removeSafe, selectAllSafes } from '../safesSlice'
import { subscribeSafe, unsubscribeSafe } from '@/src/services/notifications/SubscriptionManager'
import { selectAllChainsIds } from '../chains'
import { addDelegate } from '../delegatesSlice'

const notificationsMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const prevState = store.getState() as RootState

  const result = next(action)

  if (action.type === addSafe.type) {
    const { SafeInfo } = action.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled
    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      subscribeSafe(SafeInfo.address.value, chainIds)
    }
  }

  if (action.type === removeSafe.type) {
    const safeInfo = prevState.safes[action.payload]
    const chainIds = selectAllChainsIds(store.getState())
    if (safeInfo) {
      unsubscribeSafe(safeInfo.SafeInfo.address.value, chainIds)
    }
  }

  if (action.type === addDelegate.type) {
    const { ownerAddress, delegateInfo } = action.payload
    const notificationsEnabled = store.getState().notifications.isAppNotificationsEnabled

    if (notificationsEnabled) {
      const chainIds = selectAllChainsIds(store.getState())
      const safes = Object.values(selectAllSafes(store.getState()))
      safes.forEach((safe) => {
        const safeAddress = safe.SafeInfo.address.value
        const owners = safe.SafeInfo.owners.map((o) => o.value)
        const isTargetSafe = delegateInfo.safe
          ? delegateInfo.safe === safeAddress
          : owners.includes(ownerAddress)

        if (isTargetSafe) {
          subscribeSafe(safeAddress, chainIds)
        }
      })
    }
  }

  const prevSetting = prevState.settings as any
  const nextSetting = store.getState().settings as any
  if (prevSetting?.notificationsEnabled !== nextSetting?.notificationsEnabled) {
    const enabled = nextSetting?.notificationsEnabled
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
