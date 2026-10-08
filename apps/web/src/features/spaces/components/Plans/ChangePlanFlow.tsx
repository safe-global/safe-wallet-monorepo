import { useState } from 'react'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import ChangePlanDialog from './ChangePlanDialog'
import { getChangeDirection } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { CurrentPlan, PlanPick, SafeRef } from '@views/features/spaces/components/Plans/types'
import { ChangePlanFlowView } from '@views/features/spaces/components/Plans/ChangePlanFlowView'

export { _continueLabelFor, _pickedPrice } from '@views/features/spaces/components/Plans/ChangePlanFlowView'

export default function ChangePlanFlow({
  spaceId,
  pick,
  currentPlan,
  entry,
  onClose,
  onChanged,
}: {
  spaceId: string
  pick: PlanPick
  currentPlan: CurrentPlan
  /** Analytics: where plan selection started, carried onto the confirmation. */
  entry: Record<string, unknown>
  /** The flow is over: dismissed at any step, or the confirmation acknowledged. */
  onClose: () => void
  /** The plan changed and the confirmation is up; a parent chooser can step aside. */
  onChanged?: () => void
}) {
  const { needsTrim } = useSeatTrim(spaceId)
  const [removed, setRemoved] = useState<SafeRef[]>()
  const [isChanged, setIsChanged] = useState(false)
  const seats = pick.option.seats
  const trimTo = removed === undefined && needsTrim(seats) ? seats : undefined

  return (
    <ChangePlanFlowView
      pick={pick}
      direction={getChangeDirection(currentPlan, pick)}
      isChanged={isChanged}
      isTrialing={currentPlan.isTrialing}
      trialEndsAt={currentPlan.periodEndsAt ? Date.parse(currentPlan.periodEndsAt) : null}
      renderAccountsStep={
        trimTo === undefined
          ? undefined
          : (continueLabel) => (
              <SelectAccountsStep
                limit={trimTo}
                planName={pick.tier.name}
                continueLabel={continueLabel}
                onBack={onClose}
                onContinue={setRemoved}
              />
            )
      }
      changeDialog={
        <ChangePlanDialog
          spaceId={spaceId}
          pick={pick}
          currentPlan={currentPlan}
          entry={entry}
          removed={removed}
          onClose={onClose}
          onChanged={() => {
            setIsChanged(true)
            onChanged?.()
          }}
        />
      }
      onClose={onClose}
    />
  )
}
