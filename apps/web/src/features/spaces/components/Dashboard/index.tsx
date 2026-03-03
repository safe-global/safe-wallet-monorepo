import MembersCard from './MembersCard'
import SpacesCTACard from './SpacesCTACard'
import AddressBookCard from './ImportAddressBookCard'
import { Card, Grid2, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { flattenSafeItems } from '@/hooks/safes'
import {
  useSpaceSafes,
  useCurrentSpaceId,
  useSpaceMembersByStatus,
  useIsInvited,
  useTrackSpace,
} from '@/features/spaces'
import AddAccountsCard from './AddAccountsCard'
import { AppRoutes } from '@/config/routes'
import type { LinkProps } from 'next/link'
import NextLink from 'next/link'
import { Link } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardMembersList from './DashboardMembersList'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { MyAccountsFeature, useSpaceAccountsData } from '@/features/myAccounts'
import { useLoadFeature } from '@/features/__core__'
import AddAccounts from '@/features/spaces/components/AddAccounts'
import { useRouter } from 'next/router'
import AggregatedBalance from './AggregatedBalances'
import SafeWidget from '../SafeWidget'

const AddActionsAction = () => {
  return (
    <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.space_dashboard_card}>
      <AddAccounts />
    </Track>
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

const DASHBOARD_LIST_DISPLAY_LIMIT = 3

const SpaceDashboard = () => {
  const { AccountsWidget, $isReady } = useLoadFeature(MyAccountsFeature)
  const { allSafes: safes } = useSpaceSafes()
  const safeItems = flattenSafeItems(safes)
  const spaceId = useCurrentSpaceId()
  const { activeMembers } = useSpaceMembersByStatus()
  const isInvited = useIsInvited()
  useTrackSpace(safes, activeMembers)
  const router = useRouter()

  const safesToDisplay = safes.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)
  const membersToDisplay = activeMembers.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)

  const { accounts, isLoading: isOverviewLoading } = useSpaceAccountsData(safesToDisplay)
  const remainingCount = Math.max(0, safeItems.length - DASHBOARD_LIST_DISPLAY_LIMIT)

  const handleViewAll = () => {
    if (spaceId) {
      router.push({ pathname: AppRoutes.spaces.safeAccounts, query: { spaceId } })
    }
  }

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
            <Grid data-testid="dashboard-safe-list" size={{ xs: 12, md: 6 }}>
              {$isReady ? (
                <AccountsWidget
                  accounts={accounts}
                  loading={isOverviewLoading}
                  remainingCount={remainingCount > 0 ? remainingCount : undefined}
                  onViewAll={handleViewAll}
                  action={<AddActionsAction />}
                />
              ) : (
                <SafeWidget title="Accounts" action={<AddActionsAction />}>
                  <div className="animate-pulse rounded-lg bg-muted" />
                </SafeWidget>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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

            <Grid2 size={{ xs: 12, md: 4 }}>
              <AddressBookCard />
            </Grid2>

            <Grid size={{ xs: 12, md: 4 }}>
              <MembersCard />
            </Grid>

            <Grid2 size={{ xs: 12, md: 4 }}>
              <SpacesCTACard />
            </Grid2>
          </Grid>
        </>
      )}
    </>
  )
}

export default SpaceDashboard
