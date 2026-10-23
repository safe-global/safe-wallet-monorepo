import type {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRequestConfigurationTx,
  describeSetupCall,
  getConfigurationRoot,
} from './services/policyGuardEncoders'

import type { buildAllowlistConfigurations } from './services/allowlistConfigurations'
import type { createAllowlistSetupTxs } from './services/createAllowlistSetupTxs'

export interface PolicyGuardContract {
  createFirstSetupTxs: typeof createFirstSetupTxs
  createRequestConfigurationTx: typeof createRequestConfigurationTx
  createApplyConfigurationTx: typeof createApplyConfigurationTx
  getConfigurationRoot: typeof getConfigurationRoot
  describeSetupCall: typeof describeSetupCall
  buildAllowlistConfigurations: typeof buildAllowlistConfigurations
  createAllowlistSetupTxs: typeof createAllowlistSetupTxs
}
