import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useOidcLogin } from '../../hooks/useOidcLogin'
import type { OidcConnection } from '../../constants'

interface OidcSignInButtonProps {
  connection: OidcConnection
  label: string
  icon: ReactNode
  analyticsEvent: AnalyticsEvent
  testId: string
  variant?: 'primary' | 'secondary'
}

const OidcSignInButton = ({
  connection,
  label,
  icon,
  analyticsEvent,
  testId,
  variant = 'secondary',
}: OidcSignInButtonProps) => {
  const { loginWithRedirect } = useOidcLogin()
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH)

  const handleClick = () => {
    trackEvent(analyticsEvent)
    loginWithRedirect(connection)
  }

  if (!isOidcAuthEnabled) return null

  // The primary variant overrides shadcn's `bg-primary` token, which flips to
  // Safe-green in dark mode. The colored Google "G" has its own green path
  // (#34A853) that becomes near-invisible on a green surface. We pin the
  // light-mode bg to the design's literal `--primary: #171717`, and in dark
  // mode flip to a light surface so the button still pops against the dark
  // card (`--card: #171717` in dark mode) without competing with the brand
  // green elsewhere on the screen.
  const primaryOverride =
    variant === 'primary'
      ? 'bg-[#171717] text-white hover:bg-[#2a2a2a] dark:bg-[#fafafa] dark:text-[#0a0a0a] dark:hover:bg-[#e5e5e5]'
      : ''

  return (
    <Button
      variant={variant === 'primary' ? 'default' : 'secondary'}
      onClick={handleClick}
      data-testid={testId}
      className={`h-12 w-full gap-3 rounded-md px-4 text-[15px] font-semibold ${primaryOverride}`}
    >
      {icon}
      {label}
    </Button>
  )
}

export default OidcSignInButton
