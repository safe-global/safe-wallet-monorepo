import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { formatDate } from '@safe-global/utils/utils/date'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import ChangePlanDialog from './ChangePlanDialog'
import { formatPlanPrice, getChangeDirection, priceSuffix } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { CurrentPlan, PlanChangeDirection, PlanPick, SafeRef } from './types'

/** The accounts step leads to the change summary, not to Stripe: a live plan is moved, not bought. */
export const continueLabelFor = (direction: PlanChangeDirection): string =>
  direction === 'change' ? 'Continue' : `Continue to ${direction}`

/** A plan switched during the trial stays free until the trial ends; the confirmation says what follows. */
export const trialSwitchBody = (currentPlan: CurrentPlan, pick: PlanPick): string => {
  const until = currentPlan.periodEndsAt ? ` until ${formatDate(Date.parse(currentPlan.periodEndsAt))}` : ''
  const price =
    pick.option.price === null
      ? 'a custom price'
      : `${formatPlanPrice(pick.option.price, pick.tier.currency)}${priceSuffix(pick.tier.billingCycle)}`
  return `Your free trial continues${until}. From then on you'll pay ${price} for ${pick.tier.name}.`
}

/**
 * Moves a live plan onto the picked one. When the Workspace holds more Safes than the new plan covers, the user first
 * chooses which ones stay; the change summary then confirms both the removal and the plan change, and a confirmation
 * closes the flow.
 */
export default function ChangePlanFlow({
  spaceId,
  pick,
  currentPlan,
  onClose,
  onChanged,
}: {
  spaceId: string
  pick: PlanPick
  currentPlan: CurrentPlan
  /** The flow is over: dismissed at any step, or the confirmation acknowledged. */
  onClose: () => void
  /** The plan changed and the confirmation is up; a parent chooser can step aside. */
  onChanged?: () => void
}) {
  const { SafeProSubscriptionActivatedModal, SafeProNoticeModal } = useLoadFeature(SafeProFeature)
  const { needsTrim } = useSeatTrim(spaceId)
  const [removed, setRemoved] = useState<SafeRef[]>()
  const [isChanged, setIsChanged] = useState(false)
  const seats = pick.option.seats

  if (isChanged) {
    return currentPlan.isTrialing ? (
      <SafeProNoticeModal
        open
        title={`You're now on ${pick.tier.name}`}
        body={trialSwitchBody(currentPlan, pick)}
        actionLabel="Get started"
        onAction={onClose}
        onOpenChange={(open) => !open && onClose()}
      />
    ) : (
      <SafeProSubscriptionActivatedModal open planName={pick.tier.name} onOpenChange={(open) => !open && onClose()} />
    )
  }

  if (removed === undefined && needsTrim(seats)) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent size="md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">
            <SelectAccountsStep
              limit={seats}
              planName={pick.tier.name}
              continueLabel={continueLabelFor(getChangeDirection(currentPlan, pick))}
              onBack={onClose}
              onContinue={setRemoved}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <ChangePlanDialog
      spaceId={spaceId}
      pick={pick}
      currentPlan={currentPlan}
      removed={removed}
      onClose={onClose}
      onChanged={() => {
        setIsChanged(true)
        onChanged?.()
      }}
    />
  )
}
