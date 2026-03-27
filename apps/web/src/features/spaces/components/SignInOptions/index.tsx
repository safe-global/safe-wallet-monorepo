import { Box, Divider } from '@mui/material'
import SignInButton from '../SignInButton'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'
import css from './styles.module.css'

interface SignInOptionsProps {
  afterSignIn: () => void
  redirectLoading?: boolean
}

const SignInOptions = ({ afterSignIn, redirectLoading = false }: SignInOptionsProps) => {
  const { EmailSignInButton, GoogleSignInButton, $isDisabled, $isReady } = useLoadFeature(OidcAuthFeature)

  return (
    <Box className={css.container}>
      {!$isDisabled && $isReady && (
        <>
          <EmailSignInButton />
          <GoogleSignInButton />
          <Divider className={css.divider}>OR</Divider>
        </>
      )}

      <SignInButton
        afterSignIn={afterSignIn}
        redirectLoading={redirectLoading}
        buttonStyle="walletBtnSecondary"
        buttonText={{ connected: 'Sign in with', disconnected: 'Continue with wallet' }}
      />
    </Box>
  )
}

export default SignInOptions
