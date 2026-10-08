import type { ReactElement, ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SafeProPlanSwitchedModal, SafeProSubscriptionActivatedModal } from '../SafeProModals'
import { formatPlanPrice, priceSuffix } from './planPrice'
import type { PlanChangeDirection, PlanPick } from './types'

/** The accounts step leads to the change summary, not to Stripe: a live plan is moved, not bought. */
export const _continueLabelFor = (direction: PlanChangeDirection): string =>
  direction === 'change' ? 'Continue' : `Continue to ${direction}`

/** What the picked plan costs once the trial is over, as the confirmation words it. */
export const _pickedPrice = (pick: PlanPick): string =>
  pick.option.price === null
    ? 'a custom price'
    : `${formatPlanPrice(pick.option.price, pick.tier.currency)}${priceSuffix(pick.tier.billingCycle)}`

export type ChangePlanFlowViewProps = {
  pick: PlanPick
  direction: PlanChangeDirection
  /** The plan changed: the confirmation replaces the flow. */
  isChanged: boolean
  isTrialing: boolean
  trialEndsAt: number | null
  /** Set while the Workspace holds more Safes than the plan's seats and none were picked to leave yet. */
  renderAccountsStep?: (continueLabel: string) => ReactNode
  changeDialog: ReactNode
  onClose: () => void
}

export const ChangePlanFlowView = ({
  pick,
  direction,
  isChanged,
  isTrialing,
  trialEndsAt,
  renderAccountsStep,
  changeDialog,
  onClose,
}: ChangePlanFlowViewProps): ReactElement => {
  if (isChanged) {
    return isTrialing ? (
      <SafeProPlanSwitchedModal
        open
        planName={pick.tier.name}
        trialEndsAt={trialEndsAt}
        price={_pickedPrice(pick)}
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

  if (renderAccountsStep) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent size="md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">{renderAccountsStep(_continueLabelFor(direction))}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return <>{changeDialog}</>
}
