import SignInButton from '../SignInButton'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'
import { SignInOptionsView } from '@views/features/spaces/components/SignInOptions/SignInOptionsView'

interface SignInOptionsProps {
  afterSignIn: () => void
  redirectLoading?: boolean
}

const SignInOptions = ({ afterSignIn, redirectLoading = false }: SignInOptionsProps) => {
  const { EmailSignInButton, GoogleSignInButton, $isDisabled, $isReady } = useLoadFeature(OidcAuthFeature)
  const showOidc = !$isDisabled && $isReady

  return (
    <SignInOptionsView
      renderSignInButton={(props) => (
        <SignInButton afterSignIn={afterSignIn} redirectLoading={redirectLoading} {...props} />
      )}
      oidcButtons={
        showOidc ? (
          <>
            <GoogleSignInButton />
            <EmailSignInButton />
          </>
        ) : undefined
      }
    />
  )
}

export default SignInOptions
