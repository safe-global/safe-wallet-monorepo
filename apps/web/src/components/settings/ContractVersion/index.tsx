import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import useSafeInfo from '@/hooks/useSafeInfo'
import { CircleCheckIcon } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { MastercopyWarning, useMastercopyMigration } from '@/features/multichain'

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

  const isLatestVersion = safe.version && !(action === 'update' && isOfficialDeployer)

  const releaseUrl = safe.version ? getReleaseUrl(safe.version) : undefined

  return (
    <>
      <Typography variant="h4" className="mb-2">
        Contract version
      </Typography>

      {/* as="div": the Skeleton renders a div, which is invalid inside the default <p> */}
      <Typography as="div" className="flex items-center">
        {safeLoaded ? (
          <>
            {safe.version ?? 'Unsupported contract'}
            {isLatestVersion && (
              <>
                <CircleCheckIcon className="ml-2 mr-1 size-5 text-primary" /> Latest version
              </>
            )}
          </>
        ) : (
          <Skeleton className="h-5 w-[60px]" />
        )}
      </Typography>

      {safeLoaded && releaseUrl && (
        <Typography variant="paragraph-small" className="block mt-1">
          <ExternalLink href={releaseUrl}>View release</ExternalLink>
        </Typography>
      )}

      <div className="mt-4">
        <MastercopyWarning variant="settings" />
      </div>
    </>
  )
}
