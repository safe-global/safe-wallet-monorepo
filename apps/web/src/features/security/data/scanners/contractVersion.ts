import semverLt from 'semver/functions/lt'
import semverValid from 'semver/functions/valid'
import {
  isUnsupportedMastercopyMigratable,
  isValidMasterCopy,
} from '@safe-global/utils/services/contracts/safeContracts'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { EvidenceItem, ScanResult, SecurityScanner } from './types'
import { KNOWN_SAFE_VERSIONS, getSeverityFromScore } from './constants'

const REMEDIATION = {
  migrate: 'This version may miss security fixes and improvements. You can migrate it to a compatible version.',
  migrateWithCli: 'This version may miss security fixes and improvements. Use the CLI tool to migrate.',
  update:
    'A newer version is available. Update now to take advantage of new features and the highest security standards.',
  unrecognizedImplementation:
    'The implementation contract address does not match any known official Safe deployment. This could indicate a custom or unofficial build.',
  unverifiedOrigin:
    'This Safe was originally deployed with an unrecognized implementation contract. Its current implementation is an official Safe deployment, but the deployment origin could not be verified.',
}

const isKnownImplementation = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getSafeSingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS) ||
  hasMatchingDeployment(getSafeL2SingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS)

/** `'unknown'` when either version is missing or not semver; build metadata (`+L2`) is ignored. */
const compareVersionToLatest = (version: string | null, latestVersion: string): 'older' | 'not-older' | 'unknown' => {
  if (!version || !semverValid(version) || !semverValid(latestVersion)) return 'unknown'
  return semverLt(version, latestVersion) ? 'older' : 'not-older'
}

const result = (
  status: ScanResult['status'],
  score: number,
  evidence: EvidenceItem[],
  rest: Partial<ScanResult> = {},
): ScanResult => ({
  status,
  severity: getSeverityFromScore(score),
  score,
  evidence,
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...rest,
})

export const contractVersionScanner: SecurityScanner = {
  id: 'contract_version',
  scan: async (ctx) => {
    const { implementationVersionState, implementationAddress, version, latestVersion, chainId, creationInfo } = ctx
    const currentVersion = { label: 'Current version', value: version ?? 'Unknown' }

    // Unsupported master copy: same check as MastercopyWarning, by address since no bytecode is available here.
    if (!isValidMasterCopy(implementationVersionState)) {
      const canMigrate = isUnsupportedMastercopyMigratable(
        { implementationVersionState, version, chainId, implementation: { value: implementationAddress } },
        { recommendedVersion: latestVersion },
      )
      return result(
        'issue',
        10,
        [
          currentVersion,
          { label: 'Status', value: 'Unsupported' },
          { label: 'Implementation', value: implementationAddress },
        ],
        { remediation: canMigrate ? REMEDIATION.migrate : REMEDIATION.migrateWithCli, ctaLabelOverride: 'Migrate' },
      )
    }

    // A newer version exists for this official master copy; defers to the gateway when versions can't be compared.
    const isOutdated =
      implementationVersionState === 'OUTDATED' &&
      ctx.masterCopyDeployer === 'Gnosis' &&
      compareVersionToLatest(version, latestVersion) !== 'not-older'
    const versions = isOutdated ? [currentVersion, { label: 'Latest version', value: latestVersion }] : [currentVersion]
    const upgrade = isOutdated ? { upgradeAvailable: true } : {}

    // isNonCriticalUpdate = the Safe is on 1.3.0+, so an update is an upgrade between supported versions, not a risk.
    if (isOutdated && !ctx.isNonCriticalUpdate) {
      return result('issue', 30, versions, { remediation: REMEDIATION.update })
    }

    if (!isKnownImplementation(implementationAddress, chainId)) {
      return result(
        'issue',
        30,
        [
          currentVersion,
          { label: 'Implementation', value: implementationAddress },
          { label: 'Status', value: 'Unrecognized implementation' },
        ],
        { remediation: REMEDIATION.unrecognizedImplementation },
      )
    }

    if (creationInfo?.masterCopy && !isKnownImplementation(creationInfo.masterCopy, chainId)) {
      return result(
        'partial',
        60,
        [
          ...versions,
          { label: 'Original implementation', value: creationInfo.masterCopy },
          { label: 'Status', value: 'Deployed with unrecognized implementation' },
        ],
        { remediation: REMEDIATION.unverifiedOrigin, ...upgrade },
      )
    }

    if (isOutdated) return result('clear', 100, versions, upgrade)

    return result('clear', 100, [currentVersion, { label: 'Status', value: 'Up to date' }])
  },
}
