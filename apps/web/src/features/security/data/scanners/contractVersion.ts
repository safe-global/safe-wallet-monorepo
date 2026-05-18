import { isValidMasterCopy, isMigrationToL2Possible } from '@safe-global/utils/services/contracts/safeContracts'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SecurityScanner } from './types'
import { KNOWN_SAFE_VERSIONS, getSeverityFromScore } from './constants'

const isKnownImplementation = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getSafeSingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS) ||
  hasMatchingDeployment(getSafeL2SingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS)

export const contractVersionScanner: SecurityScanner = {
  id: 'contract_version',
  scan: async (ctx) => {
    const {
      implementationVersionState,
      implementationAddress,
      version,
      latestVersion,
      isNonCriticalUpdate,
      masterCopyDeployer,
      nonce,
      chainId,
      creationInfo,
    } = ctx
    const now = new Date().toISOString()
    const versionLabel = version ?? 'Unknown'

    // Unsupported mastercopy — same check as UnsupportedMastercopyWarning
    if (!isValidMasterCopy(implementationVersionState)) {
      // isMigrationToL2Possible only reads nonce, chainId, and implementationVersionState
      // from SafeState. We cast to satisfy the type, but only these 3 fields are accessed.
      const canMigrateL2 = isMigrationToL2Possible({
        nonce,
        chainId,
        implementationVersionState,
      } as Pick<SafeState, 'nonce' | 'chainId' | 'implementationVersionState'> as SafeState)

      const score = 10
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Status', value: 'Unsupported' },
          { label: 'Implementation', value: `${implementationAddress.slice(0, 10)}...` },
        ],
        remediation: canMigrateL2
          ? 'This version may miss security fixes and improvements. You can migrate it to a compatible version.'
          : 'This version may miss security fixes and improvements. Use the CLI tool to migrate.',
        lastChecked: now,
        ctaLabelOverride: 'Migrate',
      }
    }

    // Outdated — same checks as OutdatedMastercopyWarning
    if (implementationVersionState === 'OUTDATED' && !isNonCriticalUpdate && masterCopyDeployer === 'Gnosis') {
      const score = 30
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Latest version', value: latestVersion },
        ],
        remediation:
          'A newer version is available. Update now to take advantage of new features and the highest security standards.',
        lastChecked: now,
      }
    }

    // Version is current but implementation address is not a recognized Safe deployment
    if (!isKnownImplementation(implementationAddress, chainId)) {
      const score = 30
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Implementation', value: `${implementationAddress.slice(0, 10)}...` },
          { label: 'Status', value: 'Unrecognized implementation' },
        ],
        remediation:
          'The implementation contract address does not match any known official Safe deployment. This could indicate a custom or unofficial build.',
        lastChecked: now,
      }
    }

    // Check if original deployment used a recognized implementation
    if (creationInfo?.masterCopy && !isKnownImplementation(creationInfo.masterCopy, chainId)) {
      const score = 60
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Original implementation', value: `${creationInfo.masterCopy.slice(0, 10)}...` },
          { label: 'Status', value: 'Deployed with unrecognized implementation' },
        ],
        remediation:
          'This Safe was originally deployed with an unrecognized implementation contract. The current version is up to date, but the deployment origin could not be verified.',
        lastChecked: now,
      }
    }

    const score = 100
    return {
      status: 'clear',
      severity: getSeverityFromScore(score),
      score,
      evidence: [
        { label: 'Current version', value: versionLabel },
        { label: 'Status', value: 'Up to date' },
      ],
      remediation: '',
      lastChecked: now,
    }
  },
}
