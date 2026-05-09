import { createAction, type Action, type Reducer, type UnknownAction } from '@reduxjs/toolkit'

/**
 * Top-level reset action handled globally via `withE2EReset` (see below).
 * Dispatched at the start of each Maestro setup helper so every test runs
 * from `initialState` regardless of what previous tests left behind.
 *
 * NEVER dispatched in production code paths. Exported solely for use under
 * apps/mobile/src/tests/e2e-maestro/.
 *
 * Slices do NOT need to wire up `extraReducers` for this action — the root
 * reducer wrapper resets every slice to its `initialState` automatically.
 *
 * Slices with selective reset:
 * - settingsSlice — selectively resets to initialState while preserving
 *   `onboardingVersionSeen` so setup helpers that skip `setupBaseConfig`
 *   (e.g. `onboardAndNavigate`) don't accidentally surface the onboarding
 *   screen again. Such slices keep their own `extraReducers` handler; the
 *   wrapper preserves any value those handlers compute from current state.
 */
export const resetE2EState = createAction('e2e/resetState')

/**
 * Wraps a combined reducer so `resetE2EState` resets every slice to its
 * `initialState`. Slices that need custom reset behavior keep their own
 * `extraReducers` handler — the wrapper detects which slices changed in
 * response to the action and preserves those values, falling back to a
 * fresh `initialState` for everyone else.
 */
export const withE2EReset = <S, A extends Action, P>(reducer: Reducer<S, A, P>): Reducer<S, A, P> => {
  return ((state: S | undefined, action: A) => {
    if (action.type === resetE2EState.type && state !== undefined) {
      const fresh = reducer(undefined, action as unknown as A & UnknownAction)
      const withCustom = reducer(state, action)
      const stateRecord = state as unknown as Record<string, unknown>
      const customRecord = withCustom as unknown as Record<string, unknown>
      const result = { ...(fresh as unknown as Record<string, unknown>) }
      for (const key of Object.keys(stateRecord)) {
        if (customRecord[key] !== stateRecord[key]) {
          result[key] = customRecord[key]
        }
      }
      return result as S
    }
    return reducer(state, action)
  }) as Reducer<S, A, P>
}
