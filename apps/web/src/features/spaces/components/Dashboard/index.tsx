import MembersCard from './MembersCard'
import SpacesCTACard from './SpacesCTACard'
import AddressBookCard from './ImportAddressBookCard'
import { Grid2, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { flattenSafeItems } from '@/hooks/safes'
import {
  useSpaceSafes,
  useCurrentSpaceId,
  useSpaceMembersByStatus,
  useIsInvited,
  useTrackSpace,
  useSpacePendingTransactions,
  SpacesFeature,
} from '@/features/spaces'
import AddAccountsCard from './AddAccountsCard'
import { AppRoutes } from '@/config/routes'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
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

const DASHBOARD_LIST_DISPLAY_LIMIT = 3
const PENDING_TX_DISPLAY_LIMIT = 4

const SpaceDashboard = () => {
  const { AccountsWidget, $isReady } = useLoadFeature(MyAccountsFeature)
  const { PendingTxWidget } = useLoadFeature(SpacesFeature)
  const { allSafes: safes } = useSpaceSafes()
  const safeItems = flattenSafeItems(safes)
  const spaceId = useCurrentSpaceId()
  const { activeMembers } = useSpaceMembersByStatus()
  const isInvited = useIsInvited()
  const {
    transactions: pendingTxs,
    count: pendingTxCount,
    isLoading: isPendingTxLoading,
    error: pendingTxError,
    refetch: refetchPendingTxs,
  } = useSpacePendingTransactions(PENDING_TX_DISPLAY_LIMIT)
  useTrackSpace(safes, activeMembers)
  const router = useRouter()

  const safesToDisplay = safes.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)

  const { accounts, isLoading: isOverviewLoading, error, refetch } = useSpaceAccountsData(safesToDisplay)
  const remainingCount = Math.max(0, safeItems.length - DASHBOARD_LIST_DISPLAY_LIMIT)

  const handleViewAll = () => {
    if (spaceId) {
      router.push({ pathname: AppRoutes.spaces.safeAccounts, query: { spaceId } })
    }
  }

  const handleItemClick = (safeAddress: string) => {
    trackEvent(
      { ...SPACE_EVENTS.ACCOUNTS_WIDGET_CLICKED, label: spaceId ?? undefined },
      {
        spaceId,
        [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
      },
    )
  }

  const handleViewAllPendingTxs = () => {
    if (spaceId) {
      router.push({ pathname: AppRoutes.spaces.transactions, query: { spaceId } })
    }
  }

  const remainingPendingTxCount = Math.max(0, pendingTxCount - PENDING_TX_DISPLAY_LIMIT)

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
                  onItemClick={handleItemClick}
                  action={<AddActionsAction />}
                  error={error}
                  onRefresh={refetch}
                />
              ) : (
                <SafeWidget title="Accounts" action={<AddActionsAction />}>
                  <div className="animate-pulse rounded-lg bg-muted" />
                </SafeWidget>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <PendingTxWidget
                transactions={pendingTxs}
                loading={isPendingTxLoading}
                error={pendingTxError ? String(pendingTxError) : undefined}
                remainingCount={remainingPendingTxCount > 0 ? remainingPendingTxCount : undefined}
                onViewAll={handleViewAllPendingTxs}
                onNavigate={handleViewAllPendingTxs}
                onRefresh={refetchPendingTxs}
              />
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
