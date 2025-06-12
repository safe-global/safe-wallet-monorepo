import type { Middleware } from '@reduxjs/toolkit'
import type { RootState } from '@/src/store'
import { AnalyticsStrategyManager } from '@/src/store/middleware/analytics/AnalyticsStrategyManager'
import { ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
const strategyManager = new AnalyticsStrategyManager()

const analyticsMiddleware: Middleware = (store) => (next) => (action) => {
  const typedAction = action as ActionWithPayload
  const prevState = store.getState() as RootState

  const result = next(typedAction)

  // Execute analytics strategies after the action has been processed
  strategyManager.executeStrategy(store, typedAction, prevState)

  return result
}

export default analyticsMiddleware
