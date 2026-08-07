import type { SecurityScanner } from './types'
import { accountSetupScanner } from './accountSetup'
import { multichainSetupScanner } from './multichainSetup'
import { contractVersionScanner } from './contractVersion'
import { modulesScanner } from './modules'
import { guardScanner } from './guard'
import { pendingTxScanner } from './pendingTx'
import { recoveryScanner } from './recovery'
import { transactionScanningScanner } from './transactionScanning'
import { fallbackHandlerScanner } from './fallbackHandler'
import { factoryValidationScanner } from './factoryValidation'

export const SCANNERS: SecurityScanner[] = [
  accountSetupScanner,
  multichainSetupScanner,
  contractVersionScanner,
  modulesScanner,
  guardScanner,
  pendingTxScanner,
  recoveryScanner,
  transactionScanningScanner,
  fallbackHandlerScanner,
  factoryValidationScanner,
]
