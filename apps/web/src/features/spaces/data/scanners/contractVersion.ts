import { isValidMasterCopy, isMigrationToL2Possible } from '@safe-global/utils/services/contracts/safeContracts'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SecurityScanner } from './types'

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
      safeAddress,
    } = ctx
    const now = new Date().toISOString()
    const versionLabel = version ?? 'Unknown'

    // Unsupported mastercopy — same check as UnsupportedMastercopyWarning
    if (!isValidMasterCopy(implementationVersionState)) {
      const canMigrateL2 = isMigrationToL2Possible({
        nonce,
        chainId,
        implementationVersionState,
      } as SafeState)

      return {
        status: 'issue',
        severity: 'Critical',
        score: 10,
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
      return {
        status: 'issue',
        severity: 'High',
        score: 30,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Latest version', value: latestVersion },
        ],
        remediation:
          'A newer version is available. Update now to take advantage of new features and the highest security standards.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [
        { label: 'Current version', value: versionLabel },
        { label: 'Status', value: 'Up to date' },
      ],
      remediation: '',
      lastChecked: now,
    }
  },
}
