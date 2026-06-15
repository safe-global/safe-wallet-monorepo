import SignInButton from '../SignInButton'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'

interface SignInOptionsProps {
  afterSignIn: () => void
  redirectLoading?: boolean
}

const SignInOptions = ({ afterSignIn, redirectLoading = false }: SignInOptionsProps) => {
  const { EmailSignInButton, GoogleSignInButton, $isDisabled, $isReady } = useLoadFeature(OidcAuthFeature)
  const showOidc = !$isDisabled && $isReady

  return (
    <div className="flex w-full flex-col gap-2.5">
      {showOidc && (
        <>
          <GoogleSignInButton />
          <EmailSignInButton />

          <div className="flex items-center gap-3 py-0.5">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[13px] font-medium tracking-[0.5px] text-muted-foreground">OR</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <SignInButton
        afterSignIn={afterSignIn}
        redirectLoading={redirectLoading}
        buttonStyle="walletBtnSecondary"
        buttonText={{ connected: 'Continue with', disconnected: 'Continue with wallet' }}
      />
    </div>
  )
}

export default SignInOptions
