import type {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRequestConfigurationTx,
  describeSetupCall,
  getCallConfigurations,
  getConfigurationRoot,
} from './services/policyGuardEncoders'

import type { buildAllowlistConfigurations, decodeErc20TransferPolicyData } from './services/allowlistConfigurations'
import type { createAllowlistSetupTxs } from './services/createAllowlistSetupTxs'

export interface PolicyGuardContract {
  createFirstSetupTxs: typeof createFirstSetupTxs
  createRequestConfigurationTx: typeof createRequestConfigurationTx
  createApplyConfigurationTx: typeof createApplyConfigurationTx
  getConfigurationRoot: typeof getConfigurationRoot
  getCallConfigurations: typeof getCallConfigurations
  describeSetupCall: typeof describeSetupCall
  buildAllowlistConfigurations: typeof buildAllowlistConfigurations
  decodeErc20TransferPolicyData: typeof decodeErc20TransferPolicyData
  createAllowlistSetupTxs: typeof createAllowlistSetupTxs
}
