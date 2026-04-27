import { createAction } from '@reduxjs/toolkit'

/**
 * Top-level reset action handled via `extraReducers` in every slice that
 * carries state mutated by e2e setup helpers. Dispatched at the start of
 * each setup helper so each Maestro test runs from `initialState` regardless
 * of what previous tests left behind.
 *
 * NEVER dispatched in production code paths. Exported solely for use under
 * apps/mobile/src/tests/e2e-maestro/.
 *
 * Slices that listen for this action must add:
 *   extraReducers: (builder) => {
 *     builder.addCase(resetE2EState, () => initialState)
 *   }
 *
 * Slices intentionally NOT reset:
 * - settingsSlice — `onboardingVersionSeen` must persist across tests so
 *   setup helpers that skip `setupBaseConfig` (e.g. onboardAndNavigate)
 *   don't accidentally surface the onboarding screen again.
 */
export const resetE2EState = createAction('e2e/resetState')
