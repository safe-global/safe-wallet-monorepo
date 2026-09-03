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
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { MyAccountsFeature, useSpaceAccountsData } from '@/features/myAccounts'
import { SafeProFeature, useIsSafeProEnabled, useSafeProAnnouncement } from '@/features/safe-pro-announcement'
import { useLoadFeature } from '@/features/__core__'
import AddAccountsChooser from '../AddAccountsChooser'
import { useRouter } from 'next/router'
import AggregatedBalance from './AggregatedBalances'
import SafeWidget from '../SafeWidget'
import SetupWidget from '../SetupWidget'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useHasFeature } from '@/hooks/useChains'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Typography } from '@/components/ui/typography'
import { FEATURES } from '@safe-global/utils/utils/chains'
import TrialFlow from '../Plans/TrialFlow'
import { TIERS, TRIAL_PLANS } from '../Plans/fixtures'

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
  const { SafeProAnnouncementModal, SafeProLockedWorkspace, SafeProSubscriptionActivatedModal } =
    useLoadFeature(SafeProFeature)
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
  const [isTrialOpen, setIsTrialOpen] = useState(false)
  const [dismissedSpaces = {}] = useLocalStorage<Record<string, number>>('setupWidgetDismissed')
  const isSetupDismissedForSpace = spaceId ? (dismissedSpaces[spaceId] ?? 0) > Date.now() : false
  useTrackSpace(safes, activeMembers)
  const router = useRouter()
  const isSafeProEnabled = useIsSafeProEnabled()
  const isLocked = useHasFeature(FEATURES.SAFE_PRO) === true && !isInvited
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isLocked || !spaceId })
  const { isOpen: isAnnouncementOpen, setIsOpen: setIsAnnouncementOpen } = useSafeProAnnouncement(
    isSafeProEnabled && !isLocked && Boolean(spaceId) && !isInvited,
  )

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

  // Stripe Checkout returns to Home with `?checkout=success`; the flag is dropped once the modal closes.
  const closeCheckoutSuccess = () => {
    const query = { ...router.query }
    delete query.checkout
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const paidTier = TIERS.find((tier) => tier.isCurrent)
  const checkoutSuccessModal = paidTier?.price !== null && paidTier?.billingCycle && (
    <SafeProSubscriptionActivatedModal
      open={router.query.checkout === 'success'}
      onOpenChange={closeCheckoutSuccess}
      planName={paidTier.name}
      price={paidTier.price}
      currency={paidTier.currency}
      billingCycle={paidTier.billingCycle}
      nextBillingAt={Date.parse(TRIAL_PLANS.plan?.periodEndsAt ?? '')}
    />
  )

  if (isLocked) {
    return (
      <div className="pt-6">
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          {space?.name}
        </Typography>
        <SafeProLockedWorkspace onStartTrial={() => setIsTrialOpen(true)} />
        <TrialFlow trialDays={60} open={isTrialOpen} onOpenChange={setIsTrialOpen} />
        {checkoutSuccessModal}
      </div>
    )
  }

  return (
    <>
      {isSafeProEnabled && <SafeProAnnouncementModal open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen} />}
      {checkoutSuccessModal}

      {isInvited && <PreviewInvite />}

      <>
        <div>
          <AggregatedBalance safeItems={safeItems} accountsLoading={isOverviewLoading} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div data-testid="dashboard-safe-list" className="md:col-span-7">
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
          </div>
          <div className="md:col-span-5">
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
          </div>
        </div>
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
