import { Mail } from 'lucide-react'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../constants'
import OidcSignInButton from '../OidcSignInButton'

const EmailSignInButton = () => (
  <OidcSignInButton
    connection={OidcConnection.EMAIL}
    label="Continue with email"
    icon={<Mail size={18} />}
    analyticsEvent={SPACE_EVENTS.EMAIL_SIGN_IN}
    testId="email-login-btn"
  />
)

export default EmailSignInButton
