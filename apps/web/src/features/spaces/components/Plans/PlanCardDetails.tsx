import { Badge } from '@/components/ui/badge'
import { ListItem } from '@/components/ui/list'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

type PlanContent = {
  description: string
  support: { level: string; detail: string }
  comingSoon: string[]
}

// Copy from the plans v2 design (#8835). A developer moves it into the plan catalog.
const PLAN_CONTENT: Record<string, PlanContent | undefined> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    support: { level: 'Standard', detail: 'In-app and email' },
    comingSoon: [],
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    support: { level: 'Priority', detail: '+ Guided onboarding' },
    comingSoon: ['Pay gas from your Safe', 'Safenet checks', 'More policies'],
  },
  Enterprise: {
    description: 'Tailored to your organization, with custom capacity and commercial terms.',
    support: { level: 'Tailored', detail: '+ Customized onboarding' },
    comingSoon: [],
  },
}

/** Delays each feature check a little more than the one above it while the card is hovered. */
export const FEATURE_LIST_STAGGER = cn(
  'gap-3',
  '[&>li:nth-child(2)]:[--check-delay:15ms] [&>li:nth-child(3)]:[--check-delay:30ms]',
  '[&>li:nth-child(4)]:[--check-delay:45ms] [&>li:nth-child(5)]:[--check-delay:60ms]',
  '[&>li:nth-child(6)]:[--check-delay:75ms] [&>li:nth-child(7)]:[--check-delay:90ms]',
  '[&>li:nth-child(8)]:[--check-delay:105ms] [&>li:nth-child(n+9)]:[--check-delay:120ms]',
)

/** Feature text darkens with its checks while the card is hovered or focused. */
export const FEATURE_TEXT_HOVER = cn(
  '[&>span]:whitespace-normal [&>span]:text-muted-foreground [&>span]:transition-colors [&>span]:duration-300 [&>span]:ease-soft',
  'group-hover/plan:[&>span]:text-foreground group-focus-within/plan:[&>span]:text-foreground motion-reduce:[&>span]:transition-none',
)

/** Mint underline behind the support level that draws in while the card is hovered or focused. */
const SUPPORT_HIGHLIGHT_CLASSES = [
  'absolute -inset-x-[0.08em] bottom-[calc(6px-0.06em)] -z-10 h-1 origin-left bg-mint dark:bg-mint/40',
  'scale-x-0 transition-transform duration-[450ms] ease-soft motion-reduce:transition-none',
  'group-hover/plan:scale-x-100 group-hover/plan:delay-75 group-focus-within/plan:scale-x-100',
]

export const PlanDescription = ({ name }: { name: string }) => {
  const content = PLAN_CONTENT[name]
  return content ? (
    <Typography variant="paragraph-small" color="muted">
      {content.description}
    </Typography>
  ) : null
}

export const PlanFeaturesHeading = () => <Typography variant="paragraph-small-bold">What&apos;s included</Typography>

export const PlanComingSoon = ({ name }: { name: string }) => (
  <>
    {(PLAN_CONTENT[name]?.comingSoon ?? []).map((label) => (
      <ListItem key={label} size="sm" className="items-start py-0">
        <span aria-hidden className="size-5 shrink-0 rounded-full border border-border" />
        <span className="flex flex-wrap items-center gap-2">
          <Typography variant="paragraph-small" color="muted">
            {label}
          </Typography>
          <Badge variant="subtle" size="status" shape="status">
            Soon
          </Badge>
        </span>
      </ListItem>
    ))}
  </>
)

export const PlanSupport = ({ name }: { name: string }) => {
  const content = PLAN_CONTENT[name]
  return content ? (
    <div className="flex flex-col gap-5">
      <Separator />
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="paragraph-medium">Support</Typography>
          <Typography variant="paragraph-bold" className="relative isolate">
            {content.support.level}
            <span aria-hidden className={cn(SUPPORT_HIGHLIGHT_CLASSES)} />
          </Typography>
        </div>
        <Typography variant="paragraph-small" color="muted">
          {content.support.detail}
        </Typography>
      </div>
    </div>
  ) : null
}

/** "Billed monthly · excl. VAT" under the buttons, or the custom terms for a plan without a price. */
export const PlanPriceNote = ({ billingCycle, isCustom }: { billingCycle: string | null; isCustom: boolean }) => (
  <Typography variant="paragraph-mini" color="muted" align="center">
    {isCustom
      ? 'Pricing by agreement · Billed annually'
      : billingCycle === 'year'
        ? 'Billed yearly · excl. VAT'
        : 'Billed monthly · excl. VAT'}
  </Typography>
)

/** The monthly price of one Safe account, to the cent: "€83.45 per Safe account/mo". */
export const PlanPerSafe = ({
  price,
  seats,
  billingCycle,
  currency,
}: {
  price: number | null
  seats?: number | null
  billingCycle: string | null
  currency: string
}) =>
  price !== null && seats ? (
    <Typography variant="paragraph-small" color="muted">
      {(Math.round((price * 100) / (billingCycle === 'year' ? 12 : 1) / seats) / 100).toLocaleString('en', {
        style: 'currency',
        currency,
        minimumFractionDigits: Math.round((price * 100) / (billingCycle === 'year' ? 12 : 1) / seats) % 100 ? 2 : 0,
        maximumFractionDigits: 2,
      })}{' '}
      per Safe account/mo
    </Typography>
  ) : null
