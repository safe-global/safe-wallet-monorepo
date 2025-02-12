import { Box, Typography } from '@mui/material'
import SignInButton from '@/features/organizations/components/SignInButton'
import OrgAccountsList from '@/features/organizations/components/AccountsList'
import css from './styles.module.css'

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

const OrganizationsDashboard = ({ organizationId }: { organizationId: string }) => {
  // TODO: use the organizationId to fetch the organization data
  console.log('organizationId', organizationId)
  const isSignedIn = true
  const hasSafes = false

  return (
    <>
      <Typography variant="h1" fontWeight={700} mb={4}>
        {hasSafes ? 'Your Organization' : 'Getting started'}
      </Typography>

      <Box>{!isSignedIn ? <SignedOutState /> : <OrgAccountsList />}</Box>
    </>
  )
}

export default OrganizationsDashboard
