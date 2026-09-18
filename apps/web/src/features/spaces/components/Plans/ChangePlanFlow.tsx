import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import ChangePlanDialog from './ChangePlanDialog'
import { getChangeDirection } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { CurrentPlan, PlanChangeDirection, PlanPick, SafeRef } from './types'

/** The accounts step leads to the change summary, not to Stripe: a live plan is moved, not bought. */
export const continueLabelFor = (direction: PlanChangeDirection): string =>
  direction === 'change' ? 'Continue' : `Continue to ${direction}`

/**
 * Moves a live plan onto the picked one. When the Workspace holds more Safes than the new plan covers, the user first
 * chooses which ones stay; the change summary then confirms both the removal and the plan change.
 */
export default function ChangePlanFlow({
  spaceId,
  pick,
  currentPlan,
  onClose,
}: {
  spaceId: string
  pick: PlanPick
  currentPlan: CurrentPlan
  onClose: () => void
}) {
  const { needsTrim } = useSeatTrim(spaceId)
  const [removed, setRemoved] = useState<SafeRef[]>()
  const seats = pick.option.seats

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
    <ChangePlanDialog spaceId={spaceId} pick={pick} currentPlan={currentPlan} removed={removed} onClose={onClose} />
  )
}
