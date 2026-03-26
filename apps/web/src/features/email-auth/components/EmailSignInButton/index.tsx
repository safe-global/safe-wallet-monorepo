import { Mail } from 'lucide-react'
import Button from '@mui/material/Button'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useEmailLogin, OidcConnection } from '../../hooks/useEmailLogin'
import css from '../styles.module.css'

const EmailSignInButton = () => {
  const { loginWithRedirect } = useEmailLogin()
  const isEmailAuthEnabled = useHasFeature(FEATURES.EMAIL_AUTH)

  const handleClick = () => {
    trackEvent(SPACE_EVENTS.EMAIL_SIGN_IN)
    loginWithRedirect(OidcConnection.EMAIL)
  }

  if (!isEmailAuthEnabled) return null

  return (
    <Button
      className={css.signInButton}
      fullWidth
      disableElevation
      startIcon={<Mail size={18} />}
      onClick={handleClick}
      data-testid="email-login-btn"
    >
      Continue with email
    </Button>
  )
}

export default EmailSignInButton
