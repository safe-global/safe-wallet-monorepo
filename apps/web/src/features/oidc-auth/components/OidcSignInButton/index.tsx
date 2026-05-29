import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useOidcLogin } from '../../hooks/useOidcLogin'
import type { OidcConnection } from '../../constants'

export type OidcSignInButtonVariant = 'primary' | 'secondary'

interface OidcSignInButtonProps {
  connection: OidcConnection
  label: string
  icon: ReactNode
  analyticsEvent: AnalyticsEvent
  testId: string
  variant?: OidcSignInButtonVariant
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

  return (
    <Button
      variant={variant === 'primary' ? 'default' : 'secondary'}
      onClick={handleClick}
      data-testid={testId}
      className="h-12 w-full gap-3 rounded-md px-4 text-[15px] font-semibold"
    >
      {icon}
      {label}
    </Button>
  )
}

export default OidcSignInButton
