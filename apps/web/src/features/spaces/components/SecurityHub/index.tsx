import { type ReactElement } from 'react'
import { Box, SvgIcon, Typography } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { useCurrentSpaceId } from '@/features/spaces'
import SecurityHubContent from './SecurityHubContent'

export type { BalanceMap, OverviewMap, SelectedSafe, SpaceSafeEntry, ChainEntry } from './types'

// Hover treatment for the Safe Shield logo — recolours the SVG's named layers on hover,
// mirroring the Safe Shield widget (SafeShieldDisplay).
const shieldLogoSx = {
  width: 104,
  height: 24,
  flexShrink: 0,
  '&:hover': {
    cursor: 'pointer',
    '& .shield-bg': { fill: 'var(--color-background-secondary)' },
    '& .shield-img': { fill: 'var(--color-static-text-brand)', transition: 'fill 0.2s ease' },
    '& .shield-lines': { fill: '#121312', transition: 'fill 0.2s ease' }, // consistent between dark/light modes
    '& .shield-text': { fill: 'var(--color-text-primary)', transition: 'fill 0.2s ease' },
  },
} as const

const SecurityHub = (): ReactElement => {
  // Remount the per-space body on every space switch. The scan-results map and the
  // auto-scan queue live in `SecurityHubContent`; without this boundary a slow scan
  // from the previous space can complete after the switch and write its (stale) score
  // back into the newly selected space — most visible on large, slow-scanning spaces.
  const currentSpaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()

  return (
    <Box data-testid="security-hub">
      <Box mb={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h1">Security</Typography>

        <ExternalLink href={HelpCenterArticle.SAFE_SHIELD} noIcon>
          <SvgIcon
            component={isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull}
            inheritViewBox
            aria-label="Safe Shield"
            sx={shieldLogoSx}
          />
        </ExternalLink>
      </Box>

      <SecurityHubContent key={currentSpaceId ?? 'no-space'} />
    </Box>
  )
}

export default SecurityHub
