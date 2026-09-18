import { useEffect, useMemo, useState } from 'react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { localItem } from '@/services/local-storage/local'
import { formatDate } from '@safe-global/utils/utils/date'
import { TRIAL_ENDING_SOON_DAYS, TRIAL_LAST_REMINDER_DAYS } from '../../hooks/billing/subscription'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import ChangePlanFlow from './ChangePlanFlow'
import { ENTERPRISE_TIER } from './fixtures'
import { PlanCatalog } from './PlanCards'
import { salesHintFor } from './PlanChooserModal'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import type { CurrentPlan, PlanPick } from './types'

/** Remembers the last reminder stage dismissed, so each stage nags exactly once. */
const reminderSeen = (spaceId: string) => localItem<number>(`safeProTrialReminderSeen:${spaceId}`)

/** The reminder fires twice: on entering the last week, and again in the last two days. */
export const reminderStage = (daysLeft: number | null | undefined): number =>
  daysLeft != null && daysLeft <= TRIAL_LAST_REMINDER_DAYS ? TRIAL_LAST_REMINDER_DAYS : TRIAL_ENDING_SOON_DAYS

export const endsIn = (daysLeft: number | null): string =>
  daysLeft === null || daysLeft > 1 ? `in ${daysLeft ?? 7} days` : daysLeft === 1 ? 'in 1 day' : 'today'

const TrialEndingChooser = ({
  spaceId,
  currentPlan,
  seatsQuota,
  onClose,
}: {
  spaceId: string
  currentPlan: CurrentPlan
  seatsQuota: number | null | undefined
  onClose: () => void
}) => {
  const { paidPlans, isLoading } = useSpaceOffers(spaceId)
  const { subscription } = useSpacePlan(spaceId)
  const { openPortal, isRedirecting } = useBillingPortal(spaceId)
  const [pick, setPick] = useState<PlanPick>()
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, subscription ? { subscription, seatsQuota } : undefined).filter(
        (tier) => tier.id !== ENTERPRISE_TIER.id,
      ),
    [paidPlans, subscription, seatsQuota],
  )
  const endsAt = currentPlan.periodEndsAt ? formatDate(Date.parse(currentPlan.periodEndsAt)) : 'the end of the trial'

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent size="md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">
            <div className="flex flex-col gap-1">
              <Typography variant="h3" as={DialogTitle}>
                Your free trial will end {endsIn(currentPlan.daysLeft ?? null)}
              </Typography>
              <Typography color="muted">
                If you don&apos;t select a plan and add billing details by {endsAt}, your Workspace will be locked. Your
                Safe accounts remain available outside the Workspace.
              </Typography>
            </div>

            {isLoading ? (
              <div className="flex gap-4" data-testid="trial-ending-skeleton">
                <Skeleton className="h-[420px] flex-1 rounded-lg-xl" />
                <Skeleton className="h-[420px] flex-1 rounded-lg-xl" />
              </div>
            ) : tiers.length === 0 ? (
              <Alert variant="info">
                <AlertSeverityIcon variant="info" />
                <AlertDescription>There is no plan available for this Workspace right now.</AlertDescription>
              </Alert>
            ) : (
              <PlanCatalog
                tiers={tiers}
                currentPlan={currentPlan}
                salesHint={salesHintFor(tiers)}
                onManage={() => void openPortal()}
                onSubscribe={setPick}
                isBusy={isRedirecting}
              />
            )}

            <Button variant="ghost-muted" size="sm" className="self-center" onClick={onClose}>
              Continue without Safe Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pick && (
        <ChangePlanFlow
          spaceId={spaceId}
          pick={pick}
          currentPlan={currentPlan}
          onClose={() => setPick(undefined)}
          onChanged={onClose}
        />
      )}
    </>
  )
}

/**
 * Mounted on every Workspace page: when the trial enters its last week, and again in its last two days, an admin gets
 * the plan picker and a member a heads-up. The stage dismissed lives in local storage so each one shows once.
 */
export default function TrialEndingModal({ spaceId }: { spaceId: string }) {
  const { plan, seats, subscription, isTrialing, isTrialEndingSoon } = useSpacePlan(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isTrialEndingSoon })
  const { SafeProNoticeModal } = useLoadFeature(SafeProFeature)
  const [isOpen, setIsOpen] = useState(false)
  const stage = reminderStage(plan?.daysLeft)

  useEffect(() => {
    if (isTrialEndingSoon && membership && reminderSeen(spaceId).get() !== stage) setIsOpen(true)
  }, [isTrialEndingSoon, membership, spaceId, stage])

  if (!isOpen || !plan || !subscription) return null

  const close = () => {
    reminderSeen(spaceId).set(stage)
    setIsOpen(false)
  }
  const currentPlan = toCurrentPlan(subscription, plan, isTrialing)

  if (!isAdmin) {
    const endsAt = plan.periodEndsAt ? formatDate(Date.parse(plan.periodEndsAt)) : 'the end of the trial'
    return (
      <SafeProNoticeModal
        open
        title={`Your free trial will end ${endsIn(plan.daysLeft)}`}
        body={`${space?.name ?? 'This Workspace'} will be locked on ${endsAt} unless an admin chooses a plan and adds billing details. Your Safe accounts remain available outside the Workspace.`}
        actionLabel="Got it"
        onAction={close}
        onOpenChange={close}
      />
    )
  }

  return <TrialEndingChooser spaceId={spaceId} currentPlan={currentPlan} seatsQuota={seats?.quota} onClose={close} />
}
