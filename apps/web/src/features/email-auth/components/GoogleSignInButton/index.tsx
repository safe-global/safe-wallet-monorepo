import Button from '@mui/material/Button'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useEmailLogin, OidcConnection } from '../../hooks/useEmailLogin'
import GoogleIcon from '@/public/images/common/google.svg'
import css from '../styles.module.css'

const GoogleSignInButton = () => {
  const { loginWithRedirect } = useEmailLogin()
  const isEmailAuthEnabled = useHasFeature(FEATURES.EMAIL_AUTH)

  const handleClick = () => {
    trackEvent(SPACE_EVENTS.GOOGLE_SIGN_IN)
    loginWithRedirect(OidcConnection.GOOGLE)
  }

  if (!isEmailAuthEnabled) return null

  return (
    <Button
      className={css.signInButton}
      fullWidth
      disableElevation
      startIcon={<GoogleIcon />}
      onClick={handleClick}
      data-testid="google-login-btn"
    >
      Continue with Google
    </Button>
  )
}

export default GoogleSignInButton
