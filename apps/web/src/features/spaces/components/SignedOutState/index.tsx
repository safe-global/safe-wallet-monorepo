import { Box, Typography } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import SignInButton from '@/features/spaces/components/SignInButton'

const SignedOutState = () => {
  return (
    <Box className={css.content}>
      <Box textAlign="center" p={3}>
        <Typography variant="h2" fontWeight={700} mb={1}>
          Sign in to see your space
        </Typography>

        <SignInButton />
      </Box>
    </Box>
  )
}

export default SignedOutState
