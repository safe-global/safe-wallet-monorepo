import { useEffect, useState } from 'react'
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
import { AppRoutes } from '@/config/routes'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { MyAccountsFeature, useSpaceAccountsData } from '@/features/myAccounts'
import { useLoadFeature } from '@/features/__core__'
import AddAccountsChooser from '../AddAccountsChooser'
import { useRouter } from 'next/router'
import AggregatedBalance from './AggregatedBalances'
import SafeWidget from '../SafeWidget'
import SetupWidget from '../SetupWidget'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const EmptyStateAddAction = () => {
  return (
    <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.space_dashboard_card}>
      <AddAccountsChooser buttonVariant="default" buttonLabel="Manage accounts" entryPoint="dashboard" />
    </Track>
  )
}

const DASHBOARD_LIST_DISPLAY_LIMIT = 5
const PENDING_TX_DISPLAY_LIMIT = 4

const SpaceDashboard = () => {
  const { AccountsWidget, $isReady } = useLoadFeature(MyAccountsFeature)
  const { PendingTxWidget } = useLoadFeature(SpacesFeature)
  const { allSafes: safes, isLoading: isSafesLoading } = useSpaceSafes()
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
  const [setupDismissed, setSetupDismissed] = useState(false)
  const [dismissedSpaces = {}] = useLocalStorage<Record<string, number>>('setupWidgetDismissed')
  const isSetupDismissedForSpace = spaceId ? (dismissedSpaces[spaceId] ?? 0) > Date.now() : false
  useTrackSpace(safes, activeMembers)
  const router = useRouter()

  useEffect(() => {
    if (!spaceId) return
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: spaceId },
      {
        workspace_id: spaceId,
        pending_tx_count: pendingTxCount,
        member_count: activeMembers.length,
        safe_count: safeItems.length,
      },
    )
  }, [spaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const safesToDisplay = safes.slice(0, DASHBOARD_LIST_DISPLAY_LIMIT)

  const { isLoading: isOverviewLoading, error, refetch } = useSpaceAccountsData(safesToDisplay)

  const handleViewAll = () => {
    if (spaceId) {
      router.push({ pathname: AppRoutes.spaces.safeAccounts, query: { spaceId } })
    }
  }

  const handleItemClick = (safeAddress: string) => {
    trackEvent(
      { ...SPACE_EVENTS.ACCOUNTS_WIDGET_CLICKED, label: spaceId },
      {
        spaceId,
        [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
      },
    )
    trackEvent(
      { ...SPACE_EVENTS.SAFE_SELECTED, label: spaceId },
      {
        workspace_id: spaceId,
        [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
        source: 'accounts_widget',
      },
    )
  }

  const handlePendingTxItemClick = (safeAddress: string, txId: string) => {
    trackEvent(
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: spaceId },
      {
        spaceId,
        [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
        [MixpanelEventParams.TX_ID]: txId,
      },
    )
  }

  const showSetupWidget = safeItems.length === 0 && !isSafesLoading && !setupDismissed && !isSetupDismissedForSpace

  return (
    <>
      {isInvited && <PreviewInvite />}

      <>
        <Grid container>
          <Grid size={12}>
            <AggregatedBalance safeItems={safeItems} accountsLoading={isOverviewLoading} />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid data-testid="dashboard-safe-list" size={{ xs: 12, md: 7 }}>
            {$isReady ? (
              <AccountsWidget
                items={safesToDisplay}
                loading={isSafesLoading}
                totalCount={safes.length}
                onViewAll={handleViewAll}
                onItemClick={handleItemClick}
                emptyStateAction={<EmptyStateAddAction />}
                error={error}
                onRefresh={refetch}
              />
            ) : (
              <SafeWidget
                title="Accounts"
                action={
                  safes.length > 0 ? (
                    <SafeWidget.ViewAll
                      count={Math.max(0, safes.length - safesToDisplay.length)}
                      onClick={handleViewAll}
                    />
                  ) : undefined
                }
                testId="space-dashboard-accounts-widget"
              >
                <div className="animate-pulse rounded-lg bg-muted" />
              </SafeWidget>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            {showSetupWidget ? (
              <SetupWidget onDismiss={() => setSetupDismissed(true)} />
            ) : (
              <PendingTxWidget
                transactions={pendingTxs}
                loading={isPendingTxLoading}
                error={pendingTxError ? String(pendingTxError) : undefined}
                onRefresh={refetchPendingTxs}
                onItemClick={handlePendingTxItemClick}
              />
            )}
          </Grid>
        </Grid>
        {safeItems.length > 0 && (
          <div className="mt-4">
            <SetupWidget loading={isOverviewLoading} horizontal />
          </div>
        )}
      </>
    </>
  )
}

export default SpaceDashboard
