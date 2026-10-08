import useSafeInfo from '@/hooks/useSafeInfo'
import { MastercopyWarning, useMastercopyMigration } from '@/features/multichain'
import { ContractVersionView } from '@views/components/settings/ContractVersion/ContractVersionView'

/**
 * Generates a GitHub release URL for a specific Safe contract version.
 * Strips L2 suffix if present (e.g., "1.3.0+L2" → "v1.3.0").
 * @param version - The Safe contract version (e.g., "1.4.1" or "1.3.0+L2")
 * @returns GitHub release URL (e.g., "https://github.com/safe-fndn/safe-smart-account/releases/tag/v1.4.1")
 */
const getReleaseUrl = (version: string): string => {
  const cleanVersion = version.split('+')[0]
  return `https://github.com/safe-fndn/safe-smart-account/releases/tag/v${cleanVersion}`
}

export const ContractVersion = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const { action, isOfficialDeployer } = useMastercopyMigration()

  const isLatestVersion = !!safe.version && !(action === 'update' && isOfficialDeployer)

  const releaseUrl = safe.version ? getReleaseUrl(safe.version) : undefined

  return (
    <ContractVersionView
      safeLoaded={safeLoaded}
      version={safe.version}
      isLatestVersion={isLatestVersion}
      releaseUrl={releaseUrl}
      renderMastercopyWarning={(props) => <MastercopyWarning {...props} />}
    />
  )
}
