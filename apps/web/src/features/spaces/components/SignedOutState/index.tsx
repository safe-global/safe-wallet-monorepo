import SignInOptions from '../SignInOptions'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SignedOutStateView } from '@views/features/spaces/components/SignedOutState/SignedOutStateView'

interface SignedOutStateProps {
  afterSignIn?: () => void
  redirectLoading?: boolean
}

const SignedOutState = ({ afterSignIn, redirectLoading = false }: SignedOutStateProps) => {
  const { $isDisabled } = useLoadFeature(OidcAuthFeature)
  const isDarkMode = useDarkMode()

  return (
    <SignedOutStateView
      isDarkMode={isDarkMode}
      isEmailSignInEnabled={!$isDisabled}
      signInOptions={<SignInOptions afterSignIn={afterSignIn ?? (() => {})} redirectLoading={redirectLoading} />}
    />
  )
}

export default SignedOutState
