import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { READ_ONLY_NOTE } from '../PlanCards'
import { PLAN_CARD_COPY_V2 } from '../planCatalog'
import { getVisibleTiers } from '../planTiers'
import type { PlanTier } from '../types'
import { PlanCardV2, type PlanCardV2Actions } from './PlanCardV2'
import { getTiersV2 } from './planCardsV2'

type Cycle = 'month' | 'year'

export default function PlanCatalogV2({ tiers, ...actions }: { tiers: PlanTier[] } & PlanCardV2Actions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const hasYearly = tiers.some((tier) => tier.billingCycle === 'year')
  const visible = getVisibleTiers(getTiersV2(tiers), cycle)

  return (
    <Card radius="xl" size="sm">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
              <TabsList aria-label="Billing cycle">
                <TabsTrigger value="month">Monthly</TabsTrigger>
                <TabsTrigger value="year">
                  Yearly
                  {hasYearly && (
                    <Badge variant="mint" size="status" shape="status">
                      {PLAN_CARD_COPY_V2.yearlySavings}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Link href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" variant="muted">
              Compare all features <ArrowUpRight />
            </Link>
          </div>

          <div className="flex flex-col gap-5 md:flex-row">
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
