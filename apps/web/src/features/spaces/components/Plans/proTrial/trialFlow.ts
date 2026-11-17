import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

/** Prototype switch for variant B: `?trialFlow=workspace-first` lets the user into the Workspace before the trial. */
export const TRIAL_FLOW_PARAM = 'trialFlow'
export const WORKSPACE_FIRST = 'workspace-first'

/** Pages that only work with Pro; in variant B they open the details form the first time. */
export const PRO_FEATURE_ROUTES: Record<string, string> = {
  [AppRoutes.spaces.addressBook]: 'the shared address book',
  [AppRoutes.spaces.activity]: 'the activity log',
  [AppRoutes.spaces.policies]: 'Policies',
}

export const useIsWorkspaceFirst = (): boolean => useRouter().query[TRIAL_FLOW_PARAM] === WORKSPACE_FIRST
