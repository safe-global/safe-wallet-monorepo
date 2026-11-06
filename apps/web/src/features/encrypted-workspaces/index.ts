import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { EncryptedWorkspacesContract } from './contract'

export const EncryptedWorkspacesFeature = createFeatureHandle<EncryptedWorkspacesContract>(
  'encrypted-workspaces',
  FEATURES.SPACES,
)

export type { EncryptedWorkspacesContract } from './contract'
