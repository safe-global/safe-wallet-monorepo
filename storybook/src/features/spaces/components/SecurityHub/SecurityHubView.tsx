import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import ExternalLink from '@views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

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

export type SecurityHubViewProps = {
  isDarkMode: boolean
  content: ReactNode
}

export const SecurityHubView = ({ isDarkMode, content }: SecurityHubViewProps): ReactElement => {
  const SafeShieldLogo = isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull

  return (
    <div data-testid="security-hub">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Typography variant="h2" className="font-bold leading-none tracking-tight">
            Security hub
          </Typography>
        </div>

        <ExternalLink href={HelpCenterArticle.SECURITY_HUB} noIcon>
          <SafeShieldLogo aria-label="Safe Shield" className={shieldLogoOnHover} />
        </ExternalLink>
      </div>

      {content}
    </div>
  )
}
