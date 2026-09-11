import type { Middleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { notificationsSlice } from '@/store/notificationsSlice'
import { selectStepUpPhase } from './stepUpSlice'

/**
 * A request that needs a fresh second factor is rejected before the browser
 * leaves for the verification screen, and every call site turns that rejection
 * into an error toast. Toasts are drawn above the splash screen that covers the
 * app while it leaves, so the user sees a red message for an expected step.
 *
 * The toast is dropped here rather than at each call site, so that gating a new
 * endpoint cannot bring the message back. Only the `leaving` phase is filtered:
 * the replay on the way back reports its own failures.
 */
export const stepUpErrorFilter: Middleware<{}, RootState> = (api) => (next) => (action) => {
  const isErrorNotification =
    notificationsSlice.actions.enqueueNotification.match(action) && action.payload.variant === 'error'

  if (isErrorNotification && selectStepUpPhase(api.getState()) === 'leaving') return action

  return next(action)
}
