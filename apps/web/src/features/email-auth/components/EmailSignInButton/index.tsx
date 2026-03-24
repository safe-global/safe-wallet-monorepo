import Button from '@mui/material/Button'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useEmailLogin } from '../../hooks/useEmailLogin'

const EmailSignInButton = () => {
  const { loginWithRedirect } = useEmailLogin()
  const isEmailAuthEnabled = useHasFeature(FEATURES.EMAIL_AUTH)

  const handleClick = () => {
    trackEvent(SPACE_EVENTS.EMAIL_SIGN_IN)
    loginWithRedirect()
  }

  if (!isEmailAuthEnabled) return null

  return (
    <Button
      variant="contained"
      size="small"
      sx={{ minHeight: '42px' }}
      disableElevation
      onClick={handleClick}
      data-testid="email-login-btn"
    >
      Sign in with email
    </Button>
  )
}

export default EmailSignInButton
