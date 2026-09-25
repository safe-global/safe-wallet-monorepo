import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SafeProPlanSwitchedModal, SafeProSubscriptionActivatedModal } from '../SafeProModals'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import ChangePlanDialog from './ChangePlanDialog'
import { formatPlanPrice, getChangeDirection, priceSuffix } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { CurrentPlan, PlanChangeDirection, PlanPick, SafeRef } from './types'

/** The accounts step leads to the change summary, not to Stripe: a live plan is moved, not bought. */
export const continueLabelFor = (direction: PlanChangeDirection): string =>
  direction === 'change' ? 'Continue' : `Continue to ${direction}`

/** What the picked plan costs once the trial is over, as the confirmation words it. */
export const pickedPrice = (pick: PlanPick): string =>
  pick.option.price === null
    ? 'a custom price'
    : `${formatPlanPrice(pick.option.price, pick.tier.currency)}${priceSuffix(pick.tier.billingCycle)}`

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
  const { needsTrim } = useSeatTrim(spaceId)
  const [removed, setRemoved] = useState<SafeRef[]>()
  const [isChanged, setIsChanged] = useState(false)
  const seats = pick.option.seats

  if (isChanged) {
    return currentPlan.isTrialing ? (
      <SafeProPlanSwitchedModal
        open
        planName={pick.tier.name}
        trialEndsAt={currentPlan.periodEndsAt ? Date.parse(currentPlan.periodEndsAt) : null}
        price={pickedPrice(pick)}
        seatsLabel={pick.option.label}
        onOpenChange={(open) => !open && onClose()}
      />
    ) : (
      <SafeProSubscriptionActivatedModal
        open
        planName={pick.tier.name}
        seatsLabel={pick.option.label}
        onOpenChange={(open) => !open && onClose()}
      />
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
