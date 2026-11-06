import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { OfflineWorkspaceContract } from './contract'

// Part of Workspaces, so it shares their flag
export const OfflineWorkspaceFeature = createFeatureHandle<OfflineWorkspaceContract>(
  'offline-workspace',
  FEATURES.SPACES,
)

export type { OfflineWorkspaceContract } from './contract'
export { useIsOfflineWorkspace } from './hooks/useIsOfflineWorkspace'
