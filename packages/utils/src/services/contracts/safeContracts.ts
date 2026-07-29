import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type GetContractProps } from '@safe-global/protocol-kit'
import type { SafeVersion } from '@safe-global/types-kit'
import { assertValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { getSafeMigrationDeployments } from '@safe-global/safe-deployments'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { getChainAgnosticAddress, isOfficialMasterCopy } from '@safe-global/utils/services/contracts/deployments'
import { isSupportedMigrationVersion, type BytecodeComparisonResult } from './bytecodeComparison'

// `UNKNOWN` is returned if the mastercopy does not match supported ones
// @see https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/handlers/safes.rs#L28-L31
//      https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/converters.rs#L77-L79
export const isValidMasterCopy = (implementationVersionState: SafeState['implementationVersionState']): boolean => {
  return implementationVersionState !== 'UNKNOWN'
}

export type MastercopyMigrationOptions = {
  bytecodeResult?: BytecodeComparisonResult
  recommendedVersion?: string
}

export const isUnsupportedMastercopyMigratable = (
  safe: Pick<SafeState, 'implementationVersionState' | 'version' | 'chainId' | 'implementation'>,
  opts?: MastercopyMigrationOptions,
): boolean => {
  const targetVersion = opts?.recommendedVersion ?? LATEST_SAFE_VERSION

  const isRecognized = isValidMasterCopy(safe.implementationVersionState)
  if (isRecognized) return false
  if (!safe.version) return false

  const isMigratableSource = isSupportedMigrationVersion(safe.version, targetVersion)
  if (!isMigratableSource) return false

  const isProvablyOfficial =
    Boolean(opts?.bytecodeResult?.isMatch) || isOfficialMasterCopy(safe.implementation?.value, safe.version)
  if (!isProvablyOfficial) return false

  const isMigrationContractAvailable = Boolean(
    getChainAgnosticAddress(getSafeMigrationDeployments({ version: targetVersion }), safe.chainId),
  )
  return isMigrationContractAvailable
}

export type MastercopyAction = 'none' | 'update' | 'migrate' | 'cli'

export const getMastercopyAction = (
  safe: Pick<SafeState, 'implementationVersionState' | 'version' | 'chainId' | 'implementation'>,
  opts?: MastercopyMigrationOptions,
): MastercopyAction => {
  if (!isValidMasterCopy(safe.implementationVersionState)) {
    return isUnsupportedMastercopyMigratable(safe, opts) ? 'migrate' : 'cli'
  }

  return safe.implementationVersionState === 'OUTDATED' ? 'update' : 'none'
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
