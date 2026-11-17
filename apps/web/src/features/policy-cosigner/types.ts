import type { FeatureImplementation } from '@/features/__core__'
import type { CosignatureOutcome } from '@safe-global/utils/features/policy-cosigner/cosignature'
import type CosignerStatus from './components/CosignerStatus'
import type CosignerShieldRow from './components/CosignerShieldRow'

export type CosignerState =
  | { status: 'notRequired' }
  | { status: 'unsupportedBatch' }
  | { status: 'gasNotZero'; cosigner: string }
  /** A new tx: the service only learns of it once it is proposed */
  | { status: 'notProposed'; cosigner: string }
  /** The guard, the service or the co-signature check couldn't be read, so the decision is unknown */
  | { status: 'unavailable'; reason: string; cosigner?: string }
  | (CosignatureOutcome & { cosigner: string })

export interface PolicyCosignerContract extends FeatureImplementation {
  CosignerStatus: typeof CosignerStatus
  CosignerShieldRow: typeof CosignerShieldRow
}
