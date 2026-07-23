import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type GetContractProps } from '@safe-global/protocol-kit'
import type { SafeVersion } from '@safe-global/types-kit'
import { assertValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { getSafeMigrationDeployments } from '@safe-global/safe-deployments'
import { SAFE_TO_L2_MIGRATION_VERSION } from '@safe-global/utils/config/constants'
import {
  getChainAgnosticAddress,
  getOfficialMasterCopyDeploymentType,
} from '@safe-global/utils/services/contracts/deployments'
import { isSupportedL2Version, type BytecodeComparisonResult } from './bytecodeComparison'

// `UNKNOWN` is returned if the mastercopy does not match supported ones
// @see https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/handlers/safes.rs#L28-L31
//      https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/converters.rs#L77-L79
export const isValidMasterCopy = (implementationVersionState: SafeState['implementationVersionState']): boolean => {
  return implementationVersionState !== 'UNKNOWN'
}

/**
 * Checks if an unsupported mastercopy can be migrated based on bytecode comparison
 * with supported L2 contracts (1.3.0+L2 and 1.4.1+L2)
 *
 * @param safe - The Safe state object
 * @param bytecodeComparisonResult - Optional result from bytecode comparison
 * @returns boolean indicating if migration is possible
 */
export const canMigrateUnsupportedMastercopy = (
  safe: SafeState,
  bytecodeComparisonResult?: BytecodeComparisonResult,
): boolean => {
  // Must be an unsupported mastercopy
  if (isValidMasterCopy(safe.implementationVersionState)) {
    return false
  }

  // Must have bytecode comparison result with a match
  if (!bytecodeComparisonResult || !bytecodeComparisonResult.isMatch) {
    return false
  }

  // zksync (EraVM) bytecode matches cannot use the canonical SafeMigration flow
  if (bytecodeComparisonResult.matchedDeploymentType === 'zksync') {
    return false
  }

  // Check if migration contract is deployed on this chain
  const deployment = getSafeMigrationDeployments({ version: SAFE_TO_L2_MIGRATION_VERSION })
  return Boolean(getChainAgnosticAddress(deployment, safe.chainId))
}

export const _getValidatedGetContractProps = (
  safeVersion: SafeState['version'],
): Pick<GetContractProps, 'safeVersion'> => {
  assertValidSafeVersion(safeVersion)

  // SDK request here: https://github.com/safe-global/safe-core-sdk/issues/261
  // Remove '+L2'/'+Circles' metadata from version
  const [noMetadataVersion] = safeVersion.split('+')

  return {
    safeVersion: noMetadataVersion as SafeVersion,
  }
}
/**
 * Checks if a Safe can be migrated to the canonical L2 singleton via the
 * SafeMigration contract (`migrateL2Singleton`). The contract supports
 * 1.3.0 and 1.4.1 Safes and does not depend on the Safe's nonce.
 * Only the base version is matched — build metadata such as `+L2` or
 * `+Circles` is ignored.
 *
 * The implementation must be an official Safe singleton address: the reported
 * version comes from the contract's own VERSION() and is also returned by
 * third-party forks, for which a blind singleton swap is unsafe.
 * Byte-identical redeployments at unofficial addresses are covered separately
 * by the bytecode comparison in `canMigrateUnsupportedMastercopy`.
 */
export const isMigrationToL2Possible = (safe: Pick<SafeState, 'version' | 'chainId' | 'implementation'>): boolean => {
  if (!safe.version || !isSupportedL2Version(safe.version)) {
    return false
  }
  // Must be an official singleton, and not the zksync variant: EraVM chains
  // cannot execute the canonical SafeMigration flow this migration builds
  const deploymentType = getOfficialMasterCopyDeploymentType(safe.implementation?.value, safe.version)
  if (deploymentType === null || deploymentType === 'zksync') {
    return false
  }
  const deployment = getSafeMigrationDeployments({ version: SAFE_TO_L2_MIGRATION_VERSION })
  return Boolean(getChainAgnosticAddress(deployment, safe.chainId))
}
