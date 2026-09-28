import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { READ_ONLY_NOTE } from '../PlanCards'
import { COMPARE_COPY_V2, PLAN_CARD_COPY_V2 } from '../planCatalog'
import { getVisibleTiers } from '../planTiers'
import type { PlanTier } from '../types'
import { PlanCardV2, type PlanCardV2Actions } from './PlanCardV2'
import { getTiersV2 } from './planCardsV2'
import { COMPARE_FEATURES_ID } from './CompareFeaturesCard'

type Cycle = 'month' | 'year'

export default function PlanCatalogV2({
  tiers,
  onCompareFeatures,
  ...actions
}: {
  tiers: PlanTier[]
  /** Expands the comparison card below and moves to it; without it the link only jumps to its anchor. */
  onCompareFeatures?: () => void
} & PlanCardV2Actions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const hasYearly = tiers.some((tier) => tier.billingCycle === 'year')
  const visible = getVisibleTiers(getTiersV2(tiers), cycle)

  return (
    <Card radius="xl" size="sm">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
              <TabsList aria-label={PLAN_CARD_COPY_V2.billingCycleLabel}>
                <TabsTrigger value="month">{PLAN_CARD_COPY_V2.monthly}</TabsTrigger>
                <TabsTrigger value="year">
                  {PLAN_CARD_COPY_V2.yearly}
                  {hasYearly && (
                    <Badge variant="mint" size="status" shape="status">
                      {PLAN_CARD_COPY_V2.yearlySavings}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Link
              href={`#${COMPARE_FEATURES_ID}`}
              variant="muted"
              className="whitespace-nowrap"
              onClick={(event) => {
                if (!onCompareFeatures) return
                event.preventDefault()
                onCompareFeatures()
              }}
            >
              {COMPARE_COPY_V2.title} <ArrowDown />
            </Link>
          </div>

          {/* One shared row track per card section (the cards subgrid into it), so rows align whatever wraps. */}
          <div className="flex flex-col gap-5 md:grid md:auto-cols-fr md:grid-flow-col md:grid-rows-[auto_auto_auto_1fr_auto] md:gap-x-5 md:gap-y-0">
            {visible.map((tier) => (
              <PlanCardV2 key={tier.id} tier={tier} {...actions} />
            ))}
          </div>

          {actions.readOnly && (
            <Typography variant="paragraph-small" color="muted" align="center">
              {READ_ONLY_NOTE}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
