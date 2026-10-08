import type { ReactNode } from 'react'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useOidcLogin } from '../../hooks/useOidcLogin'
import type { OidcConnection } from '../../constants'
import { OidcSignInButtonView } from '@views/features/oidc-auth/components/OidcSignInButton/OidcSignInButtonView'

interface OidcSignInButtonProps {
  connection: OidcConnection
  label: string
  icon: ReactNode
  analyticsEvent: AnalyticsEvent
  testId: string
  variant?: 'primary' | 'secondary'
}

/** Shared by the sign-in buttons whose copy lives in their own views. */
export const useOidcSignIn = (connection: OidcConnection, analyticsEvent: AnalyticsEvent) => {
  const { loginWithRedirect } = useOidcLogin()
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH)

  const handleClick = () => {
    trackEvent(analyticsEvent)
    loginWithRedirect(connection)
  }

  return { isOidcAuthEnabled, handleClick }
}

const OidcSignInButton = ({
  connection,
  label,
  icon,
  analyticsEvent,
  testId,
  variant = 'secondary',
}: OidcSignInButtonProps) => {
  const { isOidcAuthEnabled, handleClick } = useOidcSignIn(connection, analyticsEvent)

  if (!isOidcAuthEnabled) return null

  return <OidcSignInButtonView label={label} icon={icon} testId={testId} variant={variant} onClick={handleClick} />
}

export default OidcSignInButton
