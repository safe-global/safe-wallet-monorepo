import type { SecurityScanner } from './types'
import { accountSetupScanner } from './accountSetup'
import { signerActivityScanner } from './signerActivity'
import { signerIntegrityScanner } from './signerIntegrity'
import { multichainSetupScanner } from './multichainSetup'
import { contractVersionScanner } from './contractVersion'
import { modulesScanner } from './modules'
import { guardScanner } from './guard'
import { pendingTxScanner } from './pendingTx'
import { tokenApprovalsScanner } from './tokenApprovals'
import { recoveryScanner } from './recovery'
import { addressBookScanner } from './addressBook'
import { trustedSafeScanner } from './trustedSafe'

export const SCANNERS: SecurityScanner[] = [
  accountSetupScanner,
  // signerActivityScanner,
  // signerIntegrityScanner,
  multichainSetupScanner,
  contractVersionScanner,
  // modulesScanner,
  guardScanner,
  // pendingTxScanner,
  // tokenApprovalsScanner,
  recoveryScanner,
  // addressBookScanner,
  // trustedSafeScanner,
]
