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

  // Avoid `bg-primary` here: it flips to Safe-green in dark mode and would
  // clash with the Google "G" logo's own green path. `--sidebar-primary` is
  // the project's neutral primary pair that flips dark ↔ light without the
  // brand-green override.
  const primaryOverride =
    variant === 'primary' ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' : ''

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
