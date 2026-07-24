import { Typography, Skeleton } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ExternalLink from '@/components/common/ExternalLink'
import { MastercopyWarning, useMastercopyMigration } from '@/features/multichain'
import { Box } from '@/components/common/Mui'

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
      <Typography variant="h4" fontWeight={700} marginBottom={1}>
        Contract version
      </Typography>

      <Typography variant="body1" fontWeight={400} display="flex" alignItems="center">
        {safeLoaded ? (
          <>
            {safe.version ?? 'Unsupported contract'}
            {isLatestVersion && (
              <>
                <CheckCircleIcon color="primary" sx={{ ml: 1, mr: 0.5 }} /> Latest version
              </>
            )}
          </>
        ) : (
          <Skeleton width="60px" />
        )}
      </Typography>

      {safeLoaded && releaseUrl && (
        <Typography variant="body2" mt={0.5}>
          <ExternalLink href={releaseUrl}>View release</ExternalLink>
        </Typography>
      )}

      <Box mt={2}>
        <MastercopyWarning variant="settings" />
      </Box>
    </>
  )
}
