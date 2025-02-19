import MembersCard from '@/features/organizations/components/Dashboard/MembersCard'
import NewFeaturesCard from '@/features/organizations/components/Dashboard/NewFeaturesCard'
import OrgsCTACard from '@/features/organizations/components/Dashboard/OrgsCTACard'
import { Box, Grid2, Typography } from '@mui/material'
import SignInButton from '@/features/organizations/components/SignInButton'
import OrgAccountsList from '@/features/organizations/components/AccountsList'
import Grid from '@mui/material/Grid2'
import css from './styles.module.css'

const isSignedIn = true
const hasAccounts = false
const hasMembers = false

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

  if (!isSignedIn) {
    return <SignedOutState />
  }

  return (
    <>
      <Typography variant="h1" fontWeight={700} mb={4}>
        Getting started
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: hasAccounts ? 8 : 12 }}>
          <OrgAccountsList hasAccounts={hasAccounts} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {hasMembers && (
            <Typography variant="h5" fontWeight={700} mb={2}>
              Members
            </Typography>
          )}
          <MembersCard />
        </Grid>

        <Grid2 size={{ xs: 12, md: 4 }}>
          <OrgsCTACard />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 4 }}>
          <NewFeaturesCard />
        </Grid2>
      </Grid>
    </>
  )
}

export default OrganizationsDashboard
