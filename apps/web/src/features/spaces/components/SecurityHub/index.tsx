import { type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import { useCurrentSpaceId } from '@/features/spaces'
import SecurityHubContent from './SecurityHubContent'

export type { BalanceMap, OverviewMap, SelectedSafe, SpaceSafeEntry, ChainEntry } from './types'

const SecurityHub = (): ReactElement => {
  // Remount the per-space body on every space switch. The scan-results map and the
  // auto-scan queue live in `SecurityHubContent`; without this boundary a slow scan
  // from the previous space can complete after the switch and write its (stale) score
  // back into the newly selected space — most visible on large, slow-scanning spaces.
  const currentSpaceId = useCurrentSpaceId()

  return (
    <Box data-testid="security-hub">
      <Box mb={3}>
        <Typography variant="h1" mb={0.5}>
          Security
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of security checks across your accounts.
        </Typography>
      </Box>

      <SecurityHubContent key={currentSpaceId ?? 'no-space'} />
    </Box>
  )
}

export default SecurityHub
