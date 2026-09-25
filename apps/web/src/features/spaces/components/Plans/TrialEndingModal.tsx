import { useEffect, useMemo, useState } from 'react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { markTrialReminderSeen, wasTrialReminderSeen } from '../../store/trialReminder'
import ChangePlanFlow from './ChangePlanFlow'
import { ENTERPRISE_TIER } from './planCatalog'
import { PlanCatalog } from './PlanCards'
import { salesHintFor } from './PlanChooserModal'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import type { CurrentPlan, PlanPick } from './types'

export const _endsIn = (daysLeft: number | null): string =>
  daysLeft === null || daysLeft > 1 ? `in ${daysLeft ?? 7} days` : daysLeft === 1 ? 'in 1 day' : 'today'

/** What the reminder asks of the viewer: an admin can act, a member is told who can. */
export const reminderSubtitle = (endsAt: string, isAdmin: boolean, spaceName?: string): string =>
  isAdmin
    ? `If you don't select a plan and add a payment method by ${endsAt}, your Workspace will be locked.`
    : `${spaceName ?? 'This Workspace'} will be locked on ${endsAt} unless an admin chooses a plan and adds a payment method.`

const TrialEndingChooser = ({
  spaceId,
  spaceName,
  currentPlan,
  seatsQuota,
  isAdmin,
  onClose,
}: {
  spaceId: string
  spaceName?: string
  currentPlan: CurrentPlan
  seatsQuota: number | null | undefined
  /** A member sees the same plans without any button to act on them. */
  isAdmin: boolean
  onClose: () => void
}) => {
  const { paidPlans, isLoading } = useSpaceOffers(spaceId)
  const { subscription } = useSpacePlan(spaceId)
  const { openPortal, isRedirecting } = useBillingPortal(spaceId)
  const [pick, setPick] = useState<PlanPick>()
  const [isChanged, setIsChanged] = useState(false)
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, subscription ? { subscription, seatsQuota } : undefined).filter(
        (tier) => tier.id !== ENTERPRISE_TIER.id,
      ),
    [paidPlans, subscription, seatsQuota],
  )
  const endsAt = currentPlan.periodEndsAt
    ? formatDate(Date.parse(currentPlan.periodEndsAt))
    : 'the end of your free access'

  return (
    <>
      <Dialog open={!isChanged} onOpenChange={(open) => !open && onClose()}>
        <DialogContent size="md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">
            <div className="flex flex-col gap-1">
              <Typography variant="h3" as={DialogTitle}>
                Your free access will end {_endsIn(currentPlan.daysLeft ?? null)}
              </Typography>
              <Typography color="muted">{reminderSubtitle(endsAt, isAdmin, spaceName)}</Typography>
            </div>

            {isLoading ? (
              <div className="flex gap-4" data-testid="trial-ending-skeleton">
                <Skeleton className="h-105 flex-1 rounded-lg-xl" />
                <Skeleton className="h-105 flex-1 rounded-lg-xl" />
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
                readOnly={!isAdmin}
              />
            )}

            {isAdmin ? (
              <Button variant="ghost-muted" size="sm" className="self-center" onClick={onClose}>
                Continue without Safe Pro
              </Button>
            ) : (
              <Button size="lg" className="self-center" onClick={onClose}>
                Got it
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {pick && (
        <ChangePlanFlow
          spaceId={spaceId}
          pick={pick}
          currentPlan={currentPlan}
          onClose={() => (isChanged ? onClose() : setPick(undefined))}
          onChanged={() => setIsChanged(true)}
        />
      )}
    </>
  )
}

/** Mounted on every Workspace page; shows once per login when the trial enters its last week. */
export default function TrialEndingModal({ spaceId }: { spaceId: string }) {
  const { plan, seats, subscription, isTrialing, isTrialEndingSoon, hasPaymentMethod } = useSpacePlan(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isTrialEndingSoon || isAdmin })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isTrialEndingSoon && !hasPaymentMethod && membership && !wasTrialReminderSeen(spaceId)) setIsOpen(true)
  }, [isTrialEndingSoon, hasPaymentMethod, membership, spaceId])

  if (!isOpen || !plan || !subscription) return null

  const close = () => {
    markTrialReminderSeen(spaceId)
    setIsOpen(false)
  }
  const currentPlan = toCurrentPlan(subscription, plan, isTrialing, seats?.quota)

  return (
    <TrialEndingChooser
      spaceId={spaceId}
      spaceName={space?.name}
      currentPlan={currentPlan}
      seatsQuota={seats?.quota}
      isAdmin={isAdmin}
      onClose={close}
    />
  )
}
