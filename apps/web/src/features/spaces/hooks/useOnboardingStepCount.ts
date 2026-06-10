import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'

// The Space onboarding flow always has these steps: create Workspace →
// select Safes → invite members.
const BASE_STEPS = 3

/**
 * Total number of steps shown in the Space onboarding step counter.
 *
 * The survey is an optional final step gated on the SPACE_ONBOARDING_SURVEY
 * flag, so it must only be counted when that flag is on — otherwise the
 * always-rendered steps (create / select / invite) wrongly read "X / 4".
 *
 * `useIsSurveyEnabled()` returns `undefined` while the chain config loads; we
 * treat that (and `false`) as "survey off" since the flag defaults to OFF,
 * which keeps the counter from flickering 3 → 4 on the common disabled path.
 */
export const useOnboardingStepCount = (): number => {
  return useIsSurveyEnabled() ? BASE_STEPS + 1 : BASE_STEPS
}

export default useOnboardingStepCount
