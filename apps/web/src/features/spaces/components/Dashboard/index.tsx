import MembersCard from '@/features/spaces/components/Dashboard/MembersCard'
import NewFeaturesCard from '@/features/spaces/components/Dashboard/NewFeaturesCard'
import SpacesCTACard from '@/features/spaces/components/Dashboard/SpacesCTACard'
import { Card, Grid2, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import SafesList from '@/features/myAccounts/components/SafesList'
import AddAccountsCard from './AddAccountsCard'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import type { LinkProps } from 'next/link'
import NextLink from 'next/link'
import { Link } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardMembersList from '@/features/spaces/components/Dashboard/DashboardMembersList'
import { useSpaceMembersByStatus, useIsInvited } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AggregatedBalance from '@/features/spaces/components/Dashboard/AggregatedBalances'
import useTrackSpace from '@/features/spaces/hooks/useTrackSpace'
import { flattenSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'

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

const SpaceDashboard = () => {
  const { allSafes: safes } = useSpaceSafes()
  const safeItems = flattenSafeItems(safes)
  const spaceId = useCurrentSpaceId()
  const { activeMembers } = useSpaceMembersByStatus()
  const isInvited = useIsInvited()
  useTrackSpace(safes, activeMembers)

  const safesToDisplay = safes.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)
  const membersToDisplay = activeMembers.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)

  return (
    <>
      {isInvited && <PreviewInvite />}

      {safeItems.length > 0 ? (
        <>
          <Grid container>
            <Grid size={12}>
              <AggregatedBalance safeItems={safeItems} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">Safe Accounts ({safeItems.length})</Typography>
                  {spaceId && (
                    <Track {...SPACE_EVENTS.VIEW_ALL_ACCOUNTS}>
                      <ViewAllLink url={{ pathname: AppRoutes.spaces.safeAccounts, query: { spaceId } }} />
                    </Track>
                  )}
                </Stack>
                <SafesList safes={safesToDisplay} isSpaceSafe />
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">Members ({activeMembers.length})</Typography>

                  {spaceId && (
                    <Track {...SPACE_EVENTS.VIEW_ALL_MEMBERS}>
                      <ViewAllLink url={{ pathname: AppRoutes.spaces.members, query: { spaceId } }} />
                    </Track>
                  )}
                </Stack>
                <DashboardMembersList members={membersToDisplay} />
              </Card>
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
              <SpacesCTACard />
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

export default SpaceDashboard
