import GoogleIcon from '@/public/images/common/google.svg'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../constants'
import OidcSignInButton from '../OidcSignInButton'

const GoogleSignInButton = () => (
  <OidcSignInButton
    connection={OidcConnection.GOOGLE}
    label="Continue with Google"
    icon={<GoogleIcon />}
    analyticsEvent={SPACE_EVENTS.GOOGLE_SIGN_IN}
    testId="google-login-btn"
  />
)

export default GoogleSignInButton
