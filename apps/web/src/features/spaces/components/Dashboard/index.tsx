import { useEffect, useState } from 'react'
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
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { trackEvent } from '@/services/analytics'
import { MyAccountsFeature, useSpaceAccountsData } from '@/features/myAccounts'
import { SafeProFeature, useSafeProAnnouncementModal } from '@/features/safe-pro-announcement'
import { useLoadFeature } from '@/features/__core__'
import AddAccountsChooser from '../AddAccountsChooser'
import { useRouter } from 'next/router'
import AggregatedBalance from './AggregatedBalances'
import SetupWidget from '../SetupWidget'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import CheckoutReturnModals from '../Plans/CheckoutReturnModals'
import { useWorkspaceLock } from '../../hooks/useWorkspaceLock'
import { useSpacePlanState } from '../../hooks/useSpacePlanState'
import { DashboardView } from '@views/features/spaces/components/Dashboard/DashboardView'

const DASHBOARD_LIST_DISPLAY_LIMIT = 5
const PENDING_TX_DISPLAY_LIMIT = 4

const SpaceDashboard = () => {
  const { AccountsWidget, $isReady } = useLoadFeature(MyAccountsFeature)
  const { PendingTxWidget } = useLoadFeature(SpacesFeature)
  const { SafeProAnnouncementModal } = useLoadFeature(SafeProFeature)
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
  // The lock modal is mounted by AuthState; the announcement must wait until the lock is known so both never stack.
  const { isLocked, isResolving: isResolvingPlan } = useWorkspaceLock()
  const { isOpen: isAnnouncementOpen, setIsOpen: setIsAnnouncementOpen } = useSafeProAnnouncementModal(
    !isLocked && !isResolvingPlan && Boolean(spaceId) && !isInvited,
  )

  const planState = useSpacePlanState(spaceId)

  useEffect(() => {
    if (!spaceId || !planState) return
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: spaceId },
      {
        workspace_id: spaceId,
        pending_tx_count: pendingTxCount,
        member_count: activeMembers.length,
        safe_count: safeItems.length,
        [MixpanelEventParams.PLAN_STATUS]: planState.status,
        [MixpanelEventParams.PLAN_TIER]: planState.tier,
      },
    )
  }, [spaceId, Boolean(planState)]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const checkoutModal = <CheckoutReturnModals />

  return (
    <DashboardView
      announcementModal={<SafeProAnnouncementModal open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen} />}
      checkoutModal={checkoutModal}
      previewInvite={isInvited && <PreviewInvite />}
      aggregatedBalance={<AggregatedBalance safeItems={safeItems} accountsLoading={isOverviewLoading} />}
      isAccountsWidgetReady={$isReady}
      renderAccountsWidget={({ emptyStateAction }) => (
        <AccountsWidget
          items={safesToDisplay}
          loading={isSafesLoading}
          totalCount={safes.length}
          onViewAll={handleViewAll}
          onItemClick={handleItemClick}
          emptyStateAction={emptyStateAction}
          error={error}
          onRefresh={refetch}
        />
      )}
      renderAddAccountsChooser={(props) => <AddAccountsChooser {...props} />}
      hasSafes={safes.length > 0}
      viewAllCount={Math.max(0, safes.length - safesToDisplay.length)}
      onViewAll={handleViewAll}
      sideWidget={
        showSetupWidget ? (
          <SetupWidget onDismiss={() => setSetupDismissed(true)} />
        ) : (
          <PendingTxWidget
            transactions={pendingTxs}
            loading={isPendingTxLoading}
            error={pendingTxError ? String(pendingTxError) : undefined}
            onRefresh={refetchPendingTxs}
            onItemClick={handlePendingTxItemClick}
          />
        )
      }
      bottomSetupWidget={safeItems.length > 0 && <SetupWidget loading={isOverviewLoading} horizontal />}
    />
  )
}

export default SpaceDashboard
