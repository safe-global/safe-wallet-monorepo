import { useState } from 'react'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { PlanCard, type PlanCardActions } from './PlanCard'
import { CycleTabs, PlanFootnotes, type Cycle } from './PlanCatalog'
import { getFittingSize, getPlanSizes } from './planTiers'

/** One plan card whose tabs list the sizes of every plan; the plan follows the picked size. */
export function PlanPicker({
  tiers,
  initialSeats,
  ...actions
}: {
  tiers: PlanTier[]
  /** The card opens on the smallest size that holds this many Safes. */
  initialSeats?: number
} & PlanCardActions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const [seatsLabel, setSeatsLabel] = useState<string>()
  const sizes = getPlanSizes(tiers, cycle)
  const pick = sizes.find(({ option }) => option.label === seatsLabel) ?? getFittingSize(sizes, initialSeats)

  return (
    <div className="@container flex flex-col gap-4">
      <CycleTabs cycle={cycle} onChange={setCycle} />

      {pick && (
        <PlanCard
          isOnlyCard
          tier={pick.tier}
          seatsLabel={pick.option.label}
          seatOptions={sizes.map(({ option }) => option)}
          onSeatsChange={setSeatsLabel}
          counterpartTier={tiers.find(
            (other) => other.name === pick.tier.name && other.billingCycle !== null && other.billingCycle !== cycle,
          )}
          onSwitchToYearly={() => setCycle('year')}
          {...actions}
        />
      )}

      <PlanFootnotes readOnly={actions.readOnly} />
    </div>
  )
}
