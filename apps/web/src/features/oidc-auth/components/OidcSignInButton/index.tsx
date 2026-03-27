import type { ReactNode } from 'react'
import Button from '@mui/material/Button'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useOidcLogin } from '../../hooks/useOidcLogin'
import type { OidcConnection } from '../../constants'
import css from './styles.module.css'

interface OidcSignInButtonProps {
  connection: OidcConnection
  label: string
  icon: ReactNode
  analyticsEvent: AnalyticsEvent
  testId: string
}

const OidcSignInButton = ({ connection, label, icon, analyticsEvent, testId }: OidcSignInButtonProps) => {
  const { loginWithRedirect } = useOidcLogin()
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH)

  const handleClick = () => {
    trackEvent(analyticsEvent)
    loginWithRedirect(connection)
  }

  if (!isOidcAuthEnabled) return null

  return (
    <Button
      className={css.signInButton}
      fullWidth
      disableElevation
      startIcon={icon}
      onClick={handleClick}
      data-testid={testId}
    >
      {label}
    </Button>
  )
}

export default OidcSignInButton
