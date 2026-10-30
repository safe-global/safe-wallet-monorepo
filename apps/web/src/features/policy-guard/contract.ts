import type {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRemoveGuardTxs,
  createRequestConfigurationTx,
  describeSetupCall,
  getCallConfigurations,
  getConfigurationRoot,
} from './services/policyGuardEncoders'

import type {
  buildAllowlistChangeConfigurations,
  buildAllowlistConfigurations,
  buildAllowlistRemovalConfigurations,
  clearGuardExitConfigurations,
  decodeErc20TransferPolicyData,
} from './services/allowlistConfigurations'
import type { createAllowlistSetupTxs } from './services/createAllowlistSetupTxs'

export interface PolicyGuardContract {
  createFirstSetupTxs: typeof createFirstSetupTxs
  createRequestConfigurationTx: typeof createRequestConfigurationTx
  createApplyConfigurationTx: typeof createApplyConfigurationTx
  getConfigurationRoot: typeof getConfigurationRoot
  getCallConfigurations: typeof getCallConfigurations
  describeSetupCall: typeof describeSetupCall
  buildAllowlistChangeConfigurations: typeof buildAllowlistChangeConfigurations
  buildAllowlistConfigurations: typeof buildAllowlistConfigurations
  decodeErc20TransferPolicyData: typeof decodeErc20TransferPolicyData
  buildAllowlistRemovalConfigurations: typeof buildAllowlistRemovalConfigurations
  clearGuardExitConfigurations: typeof clearGuardExitConfigurations
  createRemoveGuardTxs: typeof createRemoveGuardTxs
  createAllowlistSetupTxs: typeof createAllowlistSetupTxs
}
