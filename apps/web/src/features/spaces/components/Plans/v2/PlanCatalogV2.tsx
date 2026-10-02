import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_TERMS_URL } from '@/config/constants'
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
  embedded,
  ...actions
}: {
  tiers: PlanTier[]
  /** Opens and scrolls to the compare card. Without it, the link just jumps to the anchor. */
  onCompareFeatures?: () => void
  /** Inside a modal: no card frame and no compare link, as the compare table isn't there. */
  embedded?: boolean
} & PlanCardV2Actions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const [seatsByPlan, setSeatsByPlan] = useState<Record<string, string>>({})
  const hasYearly = tiers.some((tier) => tier.billingCycle === 'year')
  const visible = getVisibleTiers(getTiersV2(tiers), cycle)

  const catalog = (
    <div className="@container flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
          <TabsList aria-label={PLAN_CARD_COPY_V2.billingCycleLabel}>
            <TabsTrigger value="month">{PLAN_CARD_COPY_V2.monthly}</TabsTrigger>
            <TabsTrigger value="year">
              {PLAN_CARD_COPY_V2.yearly}
              {hasYearly && (
                <Badge variant="subtle" size="status" shape="status" data-testid="yearly-savings">
                  {PLAN_CARD_COPY_V2.yearlySavings}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!embedded && (
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
        )}
      </div>

      {/* One shared row track per card section (the cards subgrid into it), so rows align whatever wraps. */}
      <div className="flex flex-col gap-5 @4xl:grid @4xl:auto-cols-[minmax(0,1fr)] @4xl:grid-flow-col @4xl:grid-rows-[auto_auto_auto_1fr_auto] @4xl:gap-x-5 @4xl:gap-y-0">
        {visible.map((tier) => (
          <PlanCardV2
            key={tier.id}
            tier={tier}
            seatsLabel={seatsByPlan[tier.name]}
            onSeatsChange={(label) => setSeatsByPlan((picked) => ({ ...picked, [tier.name]: label }))}
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
        {PLAN_CARD_COPY_V2.termsApply}{' '}
        <Link href={SAFE_PRO_TERMS_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          {PLAN_CARD_COPY_V2.proTerms}
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
