import type { Middleware, AnyAction } from '@reduxjs/toolkit'
import type { RootState } from '@/src/store'
import { NotificationStrategyManager } from '@/src/store/middleware/notifications/NotificationStrategyManager'

const strategyManager = new NotificationStrategyManager()

const notificationsMiddleware: Middleware = (store) => (next) => (action) => {
  const typedAction = action as AnyAction
  const prevState = store.getState() as RootState

  const result = next(typedAction)

  strategyManager.executeStrategy(store, typedAction, prevState)

  return result
}

export default notificationsMiddleware
