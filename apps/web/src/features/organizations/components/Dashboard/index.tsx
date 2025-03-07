import MembersCard from '@/features/organizations/components/Dashboard/MembersCard'
import NewFeaturesCard from '@/features/organizations/components/Dashboard/NewFeaturesCard'
import OrgsCTACard from '@/features/organizations/components/Dashboard/OrgsCTACard'
import { Box, Grid2, Stack, Typography } from '@mui/material'
import SignInButton from '@/features/organizations/components/SignInButton'
import Grid from '@mui/material/Grid2'
import { useOrgSafes } from '@/features/organizations/hooks/useOrgSafes'
import SafesList from '@/features/myAccounts/components/SafesList'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import AddAccountsCard from './AddAccountsCard'
import { AppRoutes } from '@/config/routes'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import type { LinkProps } from 'next/link'
import NextLink from 'next/link'
import { Link } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardMembersList from '@/features/organizations/components/Dashboard/DashboardMembersList'
import { useOrgMembers } from '@/features/organizations/hooks/useOrgMembers'
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

const ViewAllLink = ({ url }: { url: LinkProps['href'] }) => {
  return (
    <NextLink href={url} passHref legacyBehavior>
      <Link
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          fontSize: '14px',
          color: 'primary.main',
        }}
      >
        View all <ChevronRightIcon fontSize="small" />
      </Link>
    </NextLink>
  )
}

const OrganizationsDashboard = () => {
  const safes = useOrgSafes()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const orgId = useCurrentOrgId()
  const { activeMembers } = useOrgMembers()

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
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Safe Accounts ({safes.length})</Typography>
                {orgId && <ViewAllLink url={{ pathname: AppRoutes.organizations.safeAccounts, query: { orgId } }} />}
              </Stack>
              {/* TODO: Set a max length for dashboard safes. */}
              <SafesList safes={safes} isOrgSafe />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Members ({activeMembers.length})</Typography>
                {orgId && <ViewAllLink url={{ pathname: AppRoutes.organizations.members, query: { orgId } }} />}
              </Stack>
              <DashboardMembersList members={activeMembers} displayLimit={5} />
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
