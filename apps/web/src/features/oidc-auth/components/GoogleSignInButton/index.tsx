import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../constants'
import { useOidcSignIn } from '../OidcSignInButton'
import { GoogleSignInButtonView } from '@views/features/oidc-auth/components/GoogleSignInButton/GoogleSignInButtonView'

const GoogleSignInButton = () => {
  const { isOidcAuthEnabled, handleClick } = useOidcSignIn(OidcConnection.GOOGLE, SPACE_EVENTS.GOOGLE_SIGN_IN)

  if (!isOidcAuthEnabled) return null

  return <GoogleSignInButtonView onClick={handleClick} />
}

export default GoogleSignInButton
