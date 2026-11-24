import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { linkTo } from '@storybook/addon-links'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { ShadcnProvider } from '@safe-global/views/components/ui/ShadcnProvider'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import { formatDate } from '@safe-global/utils/utils/date'
import { cn } from '@safe-global/views/utils/cn'
import { StoreDecorator } from '@/stories/storeDecorator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import { SAFE_PRO_HEADLINE } from '../../utils/safeProHeadline'
import css from './styles.module.css'

const DAY_MS = 24 * 60 * 60 * 1000
const TRIAL_DAYS = 30
const FROM_PRICE = '€189/mo'
const TRIAL_FEATURES = [
  '20 Safe accounts',
  '50 sponsored transactions per month',
  'Unlimited Workspace members',
  'Advanced threat analysis',
  'Transaction simulation',
  'Policy engine',
  'Shared address book',
  'MFA Authentication',
]

const FeatureCheck = () => (
  <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
    <Check className="size-3" strokeWidth={2} />
  </span>
)

const TrialIntroDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      size="xs"
      surface="card"
      padding="sm"
      showCloseButton={false}
      // eslint-disable-next-line no-restricted-syntax -- prototype: same mint stroke as the trial start window
      className="border-2 border-mint"
    >
      <div className="flex flex-col gap-6 pt-5">
        <div className="flex flex-col gap-1">
          <Typography variant="h3" as={DialogTitle}>
            {highlightSafePro(`Safe Pro ${TRIAL_DAYS}-day free trial`)}
          </Typography>
          <Typography color="muted">
            All Pro features unlocked,{' '}
            <Link
              href={SAFE_PRO_PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="muted"
              className="whitespace-nowrap"
            >
              see all features <ArrowUpRight />
            </Link>
          </Typography>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-1.5">
            <Typography variant="h4">Free</Typography>
            <Typography color="muted">then from {FROM_PRICE}</Typography>
          </div>
          <ul className="flex flex-col gap-3">
            {TRIAL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <FeatureCheck />
                <Typography variant="paragraph-small">{feature}</Typography>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            weight="semibold"
            accentIcon
            className="w-full"
            onClick={linkTo('Features/Spaces/WorkspaceWizard/NameStep', 'Empty')}
          >
            Start free trial
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            weight="semibold"
            className="w-full"
            render={<a href={SAFE_PRO_PRICING_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Explore plans
            <ArrowUpRight data-icon="inline-end" />
          </Button>
          <Button variant="ghost" size="lg" weight="semibold" className="w-full" onClick={() => onOpenChange(false)}>
            Back
          </Button>
        </div>

        <Typography variant="paragraph-small" color="muted" align="center">
          No card. No charge. Trial ends on its own {formatDate(Date.now() + TRIAL_DAYS * DAY_MS)}.
        </Typography>
      </div>
    </DialogContent>
  </Dialog>
)

const BannerWithTrialIntro = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
  const isDarkMode = useDarkMode()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <ShadcnProvider dark={isDarkMode}>
      <Card size="none" radius="xl" className={cn('w-full', css.banner)}>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className={cn('flex shrink-0 items-center rounded-md', css.proChip)}>
            <ProWordmark className="h-3 w-8 overflow-visible" />
          </span>

          <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <Typography variant="paragraph-large-bold">{SAFE_PRO_HEADLINE}</Typography>
              <Typography variant="paragraph-small" color="muted">
                Your Safe accounts remain free in My accounts.
              </Typography>
            </div>

            <Button className={cn('shrink-0', css.learnMore)} onClick={() => setOpen(true)}>
              Learn more
              <ArrowRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
            </Button>
          </div>
        </div>
      </Card>

      <TrialIntroDialog open={open} onOpenChange={setOpen} />
    </ShadcnProvider>
  )
}

const meta = {
  title: 'Prototypes/Banner opens the free trial',
  component: BannerWithTrialIntro,
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{ settings: { theme: {} } }} context={context}>
        <div className="flex min-h-[720px] justify-center bg-background p-6">
          <div className="w-full max-w-[991px]">
            <Story />
          </div>
        </div>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof BannerWithTrialIntro>

export default meta
type Story = StoryObj<typeof meta>

export const BannerClick: Story = {}

export const WindowOpen: Story = { args: { defaultOpen: true } }
