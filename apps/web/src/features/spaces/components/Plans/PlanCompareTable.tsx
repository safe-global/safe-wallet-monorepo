import { ChevronDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { FeatureCheck } from './FeatureCheck'

type CompareValue = boolean | string

type CompareRow = {
  feature: string
  isComingSoon?: boolean
  isAddOn?: boolean
  values: Record<string, CompareValue>
}

const PLANS = ['Starter', 'Business', 'Enterprise']

// Content from the plans v2 design (#8835). A developer moves it into the plan catalog.
const SECTIONS: { title: string; rows: CompareRow[] }[] = [
  {
    title: 'Limits',
    rows: [
      { feature: 'Workspaces', values: { Starter: '1', Business: '1', Enterprise: '1' } },
      { feature: 'Members', values: { Starter: 'Unlimited', Business: 'Unlimited', Enterprise: 'Unlimited' } },
      { feature: 'Safe accounts', values: { Starter: '2', Business: '5, 10 or 20', Enterprise: 'More than 20' } },
      {
        feature: 'Eligible sponsored transactions per month',
        values: { Starter: '10', Business: '50', Enterprise: 'Unlimited' },
      },
      { feature: 'Sponsoring limit per transaction', values: { Starter: '€5', Business: '€5', Enterprise: '€10' } },
    ],
  },
  {
    title: 'Operations',
    rows: [
      { feature: 'Shared address book', values: { Starter: true, Business: true, Enterprise: true } },
      { feature: 'Workspace activity log', values: { Starter: true, Business: true, Enterprise: true } },
      { feature: 'Nested Safe support', values: { Starter: true, Business: true, Enterprise: true } },
      {
        feature: 'Policies (spending limits, proposers)',
        values: { Starter: false, Business: true, Enterprise: true },
      },
      {
        feature: 'Pay gas from your Safe',
        isComingSoon: true,
        values: { Starter: false, Business: true, Enterprise: true },
      },
    ],
  },
  {
    title: 'Security & Safe Shield',
    rows: [
      { feature: 'Workspace 2FA', values: { Starter: true, Business: true, Enterprise: true } },
      { feature: 'Security Hub', values: { Starter: true, Business: true, Enterprise: true } },
      { feature: 'Advanced threat analysis', values: { Starter: true, Business: true, Enterprise: true } },
      { feature: 'Transaction simulation', values: { Starter: true, Business: true, Enterprise: true } },
      {
        feature: 'Safenet checks',
        isComingSoon: true,
        values: { Starter: 'Pay per transaction', Business: true, Enterprise: true },
      },
    ],
  },
  {
    title: 'Support & service levels',
    rows: [
      { feature: 'In-app and email support', values: { Starter: true, Business: true, Enterprise: true } },
      {
        feature: 'Priority handling within the same severity',
        values: { Starter: false, Business: true, Enterprise: true },
      },
      { feature: 'Named support contact', values: { Starter: false, Business: false, Enterprise: true } },
      { feature: 'Shared support channel', values: { Starter: false, Business: false, Enterprise: true } },
      {
        feature: 'Defined escalation path',
        values: { Starter: false, Business: 'By separate agreement', Enterprise: true },
      },
      {
        feature: 'Guided onboarding',
        values: { Starter: false, Business: 'One 60-minute session', Enterprise: 'Tailored to your needs' },
      },
    ],
  },
  {
    title: 'Add-ons',
    rows: [
      {
        feature: 'Hypernative Guardian',
        isAddOn: true,
        values: { Starter: 'Sold separately', Business: 'Sold separately', Enterprise: 'Sold separately' },
      },
    ],
  },
]

const Value = ({ value, isCurrent, isAddOn }: { value: CompareValue; isCurrent: boolean; isAddOn?: boolean }) =>
  value === true ? (
    <>
      <FeatureCheck isEmphasized={isCurrent} />
      <span className="sr-only">Included</span>
    </>
  ) : value === false ? (
    <>
      <Minus aria-hidden className="size-4 text-muted-foreground" />
      <span className="sr-only">Not included</span>
    </>
  ) : (
    <span className={cn(isAddOn && 'font-semibold')}>{value}</span>
  )

/**
 * Collapsed, the card shows the first rows fading out under an "Expand table" button. A native <details>, so it
 * needs no state, and `::details-content` keeps the rows laid out while it is closed.
 */
export const PlanCompareTable = ({ currentPlanName }: { currentPlanName?: string }) => (
  <Card radius="xl" size="none" className="overflow-clip">
    <details className="group/compare relative flex flex-col gap-2 p-2 [&::details-content]:block [&::details-content]:[content-visibility:visible]">
      <summary className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer list-none items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring group-open/compare:top-5 group-open/compare:right-5 group-open/compare:bottom-auto group-open/compare:left-auto group-open/compare:translate-x-0 [&::-webkit-details-marker]:hidden">
        <span className="group-open/compare:hidden">Expand table</span>
        <span className="hidden group-open/compare:inline">Collapse</span>
        <ChevronDown
          aria-hidden
          className="size-4 transition-transform duration-[420ms] ease-soft group-open/compare:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="flex flex-col gap-0.5 px-4 py-3.5 pr-36">
        <Typography variant="h4">Compare all features</Typography>
        <Typography variant="paragraph-small" color="muted">
          Limits, operations, security and support for every plan
        </Typography>
      </div>

      <div className="@container relative">
        <div className="max-h-96 overflow-clip rounded-xl bg-card transition-[max-height] duration-[420ms] ease-soft group-open/compare:max-h-[400rem] motion-reduce:transition-none @2xl:[&_[data-slot=table-container]]:overflow-visible">
          <Table className="min-w-160 table-fixed">
            <TableHeader className="group-open/compare:sticky group-open/compare:top-0 group-open/compare:z-10 group-open/compare:bg-card">
              <TableRow className="bg-muted-secondary hover:bg-muted-secondary">
                <TableHead scope="col" className="h-11 w-[28%] px-4 py-0 align-middle font-semibold">
                  Features
                </TableHead>
                {PLANS.map((plan) => (
                  <TableHead key={plan} scope="col" className="h-11 px-4 py-0 align-middle font-semibold">
                    <span className="flex items-center gap-2">
                      {plan} plan
                      {plan === currentPlanName && (
                        <Badge variant="mint" size="status" shape="status">
                          Current
                        </Badge>
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            {SECTIONS.map((section) => (
              <TableBody key={section.title} className="[&_tr:last-child]:border-b last:[&_tr:last-child]:border-b-0">
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead
                    scope="colgroup"
                    colSpan={PLANS.length + 1}
                    className="h-auto px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {section.title}
                  </TableHead>
                </TableRow>
                {section.rows.map((row) => (
                  <TableRow key={row.feature} className="hover:bg-transparent">
                    <TableHead scope="row" className="h-auto px-4 py-3 font-normal whitespace-normal">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {row.feature}
                        {row.isComingSoon && (
                          <Badge variant="subtle" size="status" shape="status">
                            Soon
                          </Badge>
                        )}
                      </span>
                    </TableHead>
                    {PLANS.map((plan) => (
                      <TableCell key={plan} className="px-4 py-3">
                        <Value value={row.values[plan]} isCurrent={plan === currentPlanName} isAddOn={row.isAddOn} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ))}
          </Table>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-xl bg-linear-to-b from-card/0 to-card backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,transparent,black_45%)] transition-opacity duration-300 ease-soft group-open/compare:opacity-0 motion-reduce:transition-none"
        />
      </div>
    </details>
  </Card>
)
