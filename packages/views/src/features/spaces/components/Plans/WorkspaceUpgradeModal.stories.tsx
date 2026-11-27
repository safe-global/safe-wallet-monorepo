import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ArrowRight, ArrowUpRight, Info } from 'lucide-react'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { trialFeatures, type TrialPlanName } from './planCatalog'
import { TrialFeatureList, TrialPrice, TrialSizeTabs } from './TrialPlanParts'
import type { TrialSize } from './types'

const STARTER_SUBTITLE = 'Coordinate your team with a shared home for your Safes and transactions.'
const BUSINESS_SUBTITLE = 'Scale with control. Delegate daily operations with hands-on help.'

const SIZES: TrialSize[] = [
  {
    paymentLinkId: 'plink_2',
    seats: 2,
    planName: 'Starter',
    subtitle: STARTER_SUBTITLE,
    monthlyPrice: 189,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_5',
    seats: 5,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 669,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_10',
    seats: 10,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 999,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_20',
    seats: 20,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 1669,
    currency: 'eur',
  },
]

const TRIAL_END_TOOLTIP =
  "Your paid subscription only starts once you add a payment method. If you don't add one or choose another plan before your free access ends, your Workspace will be locked. Its data is kept for 90 days and your Safe accounts remain available in My accounts."

type WorkspaceUpgradeModalProps = {
  initialSeats: number
  trialPeriodDays: number | null
  reminderDays: number
}

const WorkspaceUpgradeModal = ({ initialSeats, trialPeriodDays, reminderDays }: WorkspaceUpgradeModalProps) => {
  const [size, setSize] = useState(SIZES.find((candidate) => candidate.seats === initialSeats) ?? SIZES[0])
  const title =
    trialPeriodDays === null
      ? 'Start your free access to Safe Pro'
      : `Start your ${trialPeriodDays}-day free access to Safe Pro`

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent size="sm" surface="card" padding="md" showCloseButton={false}>
        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {highlightSafePro(title)}
            </Typography>
            <Typography color="muted">All Pro features unlocked. No billing details needed upfront.</Typography>
          </div>

          <Link href="https://safe.global/pricing" target="_blank" rel="noopener noreferrer" variant="muted">
            Compare all features <ArrowUpRight />
          </Link>

          <Card selected size="offer" radius="lg-xl" className="w-full">
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Typography variant="h4">{size.planName}</Typography>
                  <Typography variant="paragraph-small" color="muted" className="min-h-[2lh]">
                    {size.subtitle}
                  </Typography>
                </div>
                <TrialPrice size={size} trialPeriodDays={trialPeriodDays} />
                <TrialSizeTabs sizes={SIZES} value={size} onChange={setSize} />
                <Separator />
                <TrialFeatureList features={trialFeatures(size.planName as TrialPlanName)} columns={2} />
              </div>
            </CardContent>
          </Card>

          <Typography
            variant="paragraph-small"
            color="muted"
            align="center"
            className="flex items-center justify-center gap-1.5"
          >
            No payment method required. We&apos;ll remind you {reminderDays} days before your free access ends.
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-65">{TRIAL_END_TOOLTIP}</TooltipContent>
            </Tooltip>
          </Typography>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" size="lg" weight="semibold" className="w-full">
              Go to My accounts
            </Button>
            <Button size="lg" weight="semibold" accentIcon className="w-full">
              Claim free access
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const meta = {
  title: 'Features/Spaces/Plans/WorkspaceUpgradeModal (prototype)',
  component: WorkspaceUpgradeModal,
  parameters: { layout: 'fullscreen' },
  args: { initialSeats: 2, trialPeriodDays: 30, reminderDays: 7 },
  argTypes: {
    initialSeats: { control: 'inline-radio', options: SIZES.map((size) => size.seats) },
  },
} satisfies Meta<typeof WorkspaceUpgradeModal>

export default meta
type Story = StoryObj<typeof meta>

export const Starter: Story = {}

export const Business20: Story = { args: { initialSeats: 20 } }

export const NoTrialLength: Story = { args: { trialPeriodDays: null } }
