import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import SignInButton from '../SignInButton'
import EmailSignInButton from '@/features/oidc-auth/public/components/EmailSignInButton'
import GoogleSignInButton from '@/features/oidc-auth/public/components/GoogleSignInButton'

interface SignInOptionsProps {
  afterSignIn: () => void
  redirectLoading?: boolean
}

const SignInOptions = ({ afterSignIn, redirectLoading = false }: SignInOptionsProps) => {
  const showOidc = useHasFeature(FEATURES.OIDC_AUTH) === true

  return (
    <div className="flex w-full flex-col gap-2.5">
      <SignInButton
        afterSignIn={afterSignIn}
        redirectLoading={redirectLoading}
        buttonStyle="walletBtnSecondary"
        buttonText={{ connected: 'Continue with', disconnected: 'Connect wallet' }}
      />

      {showOidc && (
        <>
          <div className="flex items-center gap-3 py-0.5">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[13px] font-medium tracking-[0.5px] text-muted-foreground">OR</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton />
          <EmailSignInButton />
        </>
      )}
    </div>
  )
}

export default SignInOptions
