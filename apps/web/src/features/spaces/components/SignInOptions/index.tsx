import SignInButton from '../SignInButton'
import OidcSignInOptions from '@/features/oidc-auth/public/components/OidcSignInOptions'

interface SignInOptionsProps {
  afterSignIn: () => void
  redirectLoading?: boolean
}

const SignInOptions = ({ afterSignIn, redirectLoading = false }: SignInOptionsProps) => (
  <div className="flex w-full flex-col gap-2.5">
    <SignInButton
      afterSignIn={afterSignIn}
      redirectLoading={redirectLoading}
      buttonStyle="walletBtnSecondary"
      buttonText={{ connected: 'Continue with', disconnected: 'Connect wallet' }}
    />

    <OidcSignInOptions />
  </div>
)

export default SignInOptions
