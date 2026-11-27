import type {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRequestConfigurationTx,
  getConfigurationRoot,
} from './services/policyGuardEncoders'

export interface PolicyGuardContract {
  createFirstSetupTxs: typeof createFirstSetupTxs
  createRequestConfigurationTx: typeof createRequestConfigurationTx
  createApplyConfigurationTx: typeof createApplyConfigurationTx
  getConfigurationRoot: typeof getConfigurationRoot
}
