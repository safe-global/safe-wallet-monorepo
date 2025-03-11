import { Box, Typography } from '@mui/material'
import css from '@/features/organizations/components/Dashboard/styles.module.css'
import SignInButton from '@/features/organizations/components/SignInButton'

const SignedOutState = () => {
  return (
    <Box className={css.content}>
      <Box textAlign="center" p={3}>
        <Typography variant="h2" fontWeight={700} mb={1}>
          Sign in to see your organization
        </Typography>

        <Typography variant="body2" mb={2} color="primary.light">
          Description
        </Typography>

        <SignInButton />
      </Box>
    </Box>
  )
}

export default SignedOutState
