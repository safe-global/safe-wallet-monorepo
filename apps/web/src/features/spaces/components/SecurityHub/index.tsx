import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
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
const shieldLogoOnHover = [
  'h-6 w-[104px] shrink-0 cursor-pointer',
  '[&_.shield-img]:transition-[fill] [&_.shield-lines]:transition-[fill] [&_.shield-text]:transition-[fill]',
  'hover:[&_.shield-bg]:fill-[var(--color-background-secondary)]',
  'hover:[&_.shield-img]:fill-[var(--color-static-text-brand)]',
  'hover:[&_.shield-lines]:fill-[var(--color-static-main)]', // static token: same value in both themes
  'hover:[&_.shield-text]:fill-[var(--color-text-primary)]',
].join(' ')

const SecurityHub = (): ReactElement => {
  // Remount the per-space body on every space switch: the scan-results map and auto-scan queue live in
  // `SecurityHubContent`, so without this boundary a slow prior-space scan can finish after the switch and write its stale score into the new space.
  const currentSpaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()
  const SafeShieldLogo = isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull

  return (
    <div data-testid="security-hub">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Typography variant="h1" className="mb-1 text-[32px] leading-9">
            Security hub
          </Typography>
        </div>

        <ExternalLink href={HelpCenterArticle.SECURITY_HUB} noIcon>
          <SafeShieldLogo aria-label="Safe Shield" className={shieldLogoOnHover} />
        </ExternalLink>
      </div>

      <SecurityHubContent key={currentSpaceId ?? 'no-space'} />
    </div>
  )
}

export default SecurityHub
