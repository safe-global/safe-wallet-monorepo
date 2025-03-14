import MembersCard from '@/features/organizations/components/Dashboard/MembersCard'
import NewFeaturesCard from '@/features/organizations/components/Dashboard/NewFeaturesCard'
import OrgsCTACard from '@/features/organizations/components/Dashboard/OrgsCTACard'
import { Grid2, Stack, Typography } from '@mui/material'
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
import SignedOutState from '@/features/organizations/components/SignedOutState'
import { isUnauthorized } from '@/features/organizations/utils'
import UnauthorizedState from '@/features/organizations/components/UnauthorizedState'

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

const DASHBOARD_LIST_DISPLAY_LIMIT = 5

const OrganizationsDashboard = () => {
  const { allSafes: safes, error } = useOrgSafes()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const orgId = useCurrentOrgId()
  const { activeMembers } = useOrgMembers()

  const safesToDisplay = safes.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)
  const membersToDisplay = activeMembers.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

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
              <SafesList safes={safesToDisplay} isOrgSafe />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Members ({activeMembers.length})</Typography>
                {orgId && <ViewAllLink url={{ pathname: AppRoutes.organizations.members, query: { orgId } }} />}
              </Stack>
              <DashboardMembersList members={membersToDisplay} />
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
