import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../constants'
import { useOidcSignIn } from '../OidcSignInButton'
import { EmailSignInButtonView } from '@views/features/oidc-auth/components/EmailSignInButton/EmailSignInButtonView'

const EmailSignInButton = () => {
  const { isOidcAuthEnabled, handleClick } = useOidcSignIn(OidcConnection.EMAIL, SPACE_EVENTS.EMAIL_SIGN_IN)

  if (!isOidcAuthEnabled) return null

  return <EmailSignInButtonView onClick={handleClick} />
}

export default EmailSignInButton
