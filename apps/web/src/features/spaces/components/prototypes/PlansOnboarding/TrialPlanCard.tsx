import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { PLAN_SUBTITLE, trialFeatures, type TrialSize } from './plans'
import { FeatureList, SizeTabs, TrialPrice } from './TrialParts'

/** Vertical plan card whose title, copy and features follow the picked size: 2 Safes is Starter, more is Business. */
const TrialPlanCard = ({ size, onSizeChange }: { size: TrialSize; onSizeChange: (size: TrialSize) => void }) => (
  <Card selected size="offer" radius="lg-xl" className="w-full max-w-md" data-testid="trial-plan-card">
    <CardContent>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Typography variant="h4">{size.plan}</Typography>
          <Typography variant="paragraph-small" color="muted">
            {PLAN_SUBTITLE[size.plan]}
          </Typography>
        </div>
        <TrialPrice size={size} />
        <SizeTabs value={size} onChange={onSizeChange} />
        <Separator />
        <FeatureList features={trialFeatures(size.plan)} columns={2} />
      </div>
    </CardContent>
  </Card>
)

export default TrialPlanCard
