import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Link } from '@safe-global/views/components/ui/link'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SAFE_PRO_SERVICE_DESCRIPTIONS_URL, SAFE_PRO_TERMS_URL } from '@/config/constants'
import { COMPARE_FEATURES_ID } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { PlanCard, type PlanCardActions } from './PlanCard'
import { getCatalogTiers, getVisibleTiers } from './planTiers'

type Cycle = 'month' | 'year'

const READ_ONLY_NOTE = 'Only admins can change the plan. Ask an admin to upgrade, switch or change seats.'

export function PlanCatalog({
  tiers,
  onCompareFeatures,
  embedded,
  ...actions
}: {
  tiers: PlanTier[]
  onCompareFeatures?: () => void
  embedded?: boolean
} & PlanCardActions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const [seatsByPlan, setSeatsByPlan] = useState<Record<string, string>>({})
  const visible = getVisibleTiers(getCatalogTiers(tiers), cycle)

  const catalog = (
    <div className="@container flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
          <TabsList aria-label="Billing cycle">
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        {!embedded && (
          <Link
            href={`#${COMPARE_FEATURES_ID}`}
            variant="muted"
            className="hidden whitespace-nowrap @2xl:inline"
            onClick={(event) => {
              if (!onCompareFeatures) return
              event.preventDefault()
              onCompareFeatures()
            }}
          >
            Compare all features <ArrowDown />
          </Link>
        )}
      </div>

      <div className="group/plans flex flex-col gap-5 @4xl:grid @4xl:auto-cols-[minmax(0,1fr)] @4xl:grid-flow-col @4xl:grid-rows-[auto_auto_auto_1fr_auto] @4xl:gap-x-5 @4xl:gap-y-0">
        {visible.map((tier) => (
          <PlanCard
            key={tier.id}
            tier={tier}
            seatsLabel={seatsByPlan[tier.name]}
            onSeatsChange={(label) => setSeatsByPlan((picked) => ({ ...picked, [tier.name]: label }))}
            counterpartTier={tiers.find(
              (other) =>
                other.name === tier.name && other.billingCycle !== null && other.billingCycle !== tier.billingCycle,
            )}
            onSwitchToYearly={() => setCycle('year')}
            {...actions}
          />
        ))}
      </div>

      {actions.readOnly && (
        <Typography variant="paragraph-small" color="muted" align="center">
          {READ_ONLY_NOTE}
        </Typography>
      )}

      <Typography variant="paragraph-mini" color="muted" align="center">
        Terms apply:{' '}
        <Link href={SAFE_PRO_TERMS_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          Safe Pro Terms
        </Link>
        {' · '}
        <Link href={SAFE_PRO_SERVICE_DESCRIPTIONS_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          Service Descriptions
        </Link>
      </Typography>
    </div>
  )

  if (embedded) return catalog

  return (
    <Card radius="xl" size="sm">
      <CardContent>{catalog}</CardContent>
    </Card>
  )
}
