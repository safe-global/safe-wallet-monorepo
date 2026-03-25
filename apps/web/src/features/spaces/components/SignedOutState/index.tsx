import { Box, Stack, Typography } from '@mui/material'
import css from '../Dashboard/styles.module.css'
import SignInOptions from '../SignInOptions'
import { EmailAuthFeature } from '@/features/email-auth'
import { useLoadFeature } from '@/features/__core__'

interface SignedOutStateProps {
  afterSignIn?: () => void
  redirectLoading?: boolean
}

const SignedOutState = ({ afterSignIn, redirectLoading = false }: SignedOutStateProps) => {
  const { $isDisabled } = useLoadFeature(EmailAuthFeature)

  return (
    <Box className={css.content}>
      <Box textAlign="center" className={css.contentWrapper}>
        <Box className={css.contentInner}>
          <Typography fontWeight={700} mb={2}>
            Sign in to see content
          </Typography>

          <Typography color="text.secondary" mb={2}>
            To view and interact with spaces, you need to sign in with the wallet, that is a member of the space
            {!$isDisabled && ', or sign in with email'}. Sign in to continue. To view and interact with spaces, you need
            to sign in with the wallet, that is a member of the space
            {!$isDisabled && ', or sign in with email'}. Sign in to continue.
          </Typography>

          <SignInOptions afterSignIn={afterSignIn ?? (() => {})} redirectLoading={redirectLoading} />
        </Box>
      </Box>
    </Box>
  )
}

export default SignedOutState
