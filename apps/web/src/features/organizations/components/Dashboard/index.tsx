import MembersCard from '@/features/organizations/components/Dashboard/MembersCard'
import NewFeaturesCard from '@/features/organizations/components/Dashboard/NewFeaturesCard'
import OrgsCTACard from '@/features/organizations/components/Dashboard/OrgsCTACard'
import { Box, Grid2, Typography } from '@mui/material'
import SignInButton from '@/features/organizations/components/SignInButton'
import Grid from '@mui/material/Grid2'
import css from './styles.module.css'
import { useOrgSafes } from '@/features/organizations/hooks/useOrgSafes'
import SafesList from '@/features/myAccounts/components/SafesList'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import AddAccountsCard from './AddAccountsCard'

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

const OrganizationsDashboard = () => {
  const safes = useOrgSafes()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  if (!isUserSignedIn) {
    return <SignedOutState />
  }

  return (
    <>
      {safes.length > 0 ? (
        <>
          <Typography variant="h1" fontWeight={700} mb={4}>
            Dashboard
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h5" mb={3}>
                Safe Accounts ({safes.length})
              </Typography>
              <SafesList safes={safes} isOrgSafe />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" mb={3}>
                Members
              </Typography>
              <></>
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Typography variant="h1" fontWeight={700} mb={4}>
            Getting started
          </Typography>

          <Grid container spacing={3}>
            <Grid size={12}>
              <AddAccountsCard />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
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
      )}
    </>
  )
}

export default OrganizationsDashboard
