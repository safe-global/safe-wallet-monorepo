import { Box, Stack, Typography } from '@mui/material'
import css from '../Dashboard/styles.module.css'
import SignInButton from '../SignInButton'
import { useLoadFeature } from '@/features/__core__'
import { EmailAuthFeature } from '@/features/email-auth'

const SignedOutState = () => {
  const { EmailSignInButton } = useLoadFeature(EmailAuthFeature)

  return (
    <Box className={css.content}>
      <Box textAlign="center" className={css.contentWrapper}>
        <Box className={css.contentInner}>
          <Typography fontWeight={700} mb={2}>
            Sign in to see content
          </Typography>

          <Typography color="text.secondary" mb={2}>
            To view and interact with spaces, you need to sign in with the wallet, that is a member of the space. Sign
            in to continue.
          </Typography>

          <Stack direction="row" justifyContent="center" spacing={2} alignItems="center">
            <EmailSignInButton />
            <SignInButton />
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

export default SignedOutState
