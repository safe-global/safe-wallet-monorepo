import { useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { DEFAULT_SIZE, PLAN_SUBTITLE, trialFeatures, type TrialSize } from './plans'
import { FeatureList, SizeTabs, TrialPrice } from './TrialParts'

/** The trial offer as a plan picker: Starter by default, the price only as a quiet line above the CTA. */
const TrialPickerModal = ({ onStart, onBack }: { onStart?: (size: TrialSize) => void; onBack?: () => void }) => {
  const [size, setSize] = useState(DEFAULT_SIZE)

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        size="xs"
        surface="card"
        padding="sm"
        showCloseButton={false}
        // eslint-disable-next-line no-restricted-syntax -- prototype: the Safe Pro mint stroke has no DialogContent variant yet
        className="border-2 border-mint"
        data-testid="trial-picker-modal"
      >
        <div className="flex flex-col gap-6 pt-5">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {highlightSafePro(`Safe Pro ${size.plan}`)}
            </Typography>
            <Typography color="muted" className="min-h-[2lh]">
              {PLAN_SUBTITLE[size.plan]}{' '}
              <Link href={SAFE_PRO_PRICING_URL} target="_blank" rel="noopener noreferrer" variant="muted">
                Compare plans <ArrowUpRight />
              </Link>
            </Typography>
          </div>

          <SizeTabs value={size} onChange={setSize} />
          <FeatureList features={trialFeatures(size.plan)} columns={2} />

          <div className="flex flex-col gap-2">
            <TrialPrice size={size} compact />
            <Button size="lg" weight="semibold" accentIcon className="w-full" onClick={() => onStart?.(size)}>
              Start free trial
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="lg" weight="semibold" className="w-full" onClick={onBack}>
              Go to My accounts
            </Button>
          </div>

          <Typography variant="paragraph-small" color="muted" align="center">
            No card needed. You won&apos;t be charged after the trial ends.
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TrialPickerModal
