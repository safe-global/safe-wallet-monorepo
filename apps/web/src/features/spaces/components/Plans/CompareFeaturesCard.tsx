import { useRef, useState, type CSSProperties, type Ref } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Card } from '@safe-global/views/components/ui/card'
import { Link } from '@safe-global/views/components/ui/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Typography } from '@safe-global/views/components/ui/typography'
import { HnSignupFlow } from '@/features/hypernative'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { cn } from '@safe-global/views/utils/cn'
import {
  COMPARE_COPY,
  COMPARE_SECTIONS,
  type CompareRow,
  type CompareValue,
  PLAN_ORDER,
  type CompareSection,
} from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import { FeatureCheck } from './FeatureCheck'
import PeekCollapsible from './PeekCollapsible'

export const COMPARE_FEATURES_ID = 'compare-features'

/** Collapsed, only the coming-soon rows show in full; the next row fades out under the button. */
const VISIBLE_FEATURES = COMPARE_SECTIONS[0].rows.length
const PEEK_FEATURES = 1

const CompareValue = ({ value }: { value: CompareValue }) => {
  if (value === true) {
    return (
      <>
        <FeatureCheck />
        <span className="sr-only">{COMPARE_COPY.included}</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden className="text-muted-foreground">
          —
        </span>
        <span className="sr-only">{COMPARE_COPY.notIncluded}</span>
      </>
    )
  }
  return <>{value}</>
}

const trackDiscussAddOn = () =>
  trackEvent(
    { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: SAFE_PRO_PLANS_LABELS.discuss_add_on },
    { [MixpanelEventParams.LOCATION]: SAFE_PRO_PLANS_LABELS.discuss_add_on },
  )

/** Opens the Guardian signup. */
const AddOnLink = ({ label, onOpen }: { label: string; onOpen: () => void }) => (
  <Link
    render={<button type="button" />}
    className="font-semibold"
    onClick={() => {
      trackDiscussAddOn()
      onOpen()
    }}
  >
    {label}
  </Link>
)

const CompareRow = ({
  row,
  isFolded,
  onOpenAddOn,
  ref,
}: {
  row: CompareRow
  isFolded: boolean
  onOpenAddOn: () => void
  ref?: Ref<HTMLTableRowElement>
}) => (
  <TableRow
    ref={ref}
    inert={isFolded}
    aria-hidden={isFolded || undefined}
    data-add-on={row.isAddOn || undefined}
    className="hover:bg-transparent"
  >
    <TableHead scope="row" className="h-auto px-4 py-3 font-normal whitespace-normal">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {row.feature}
        {row.isAddOn && <AddOnLink label={COMPARE_COPY.learnMore} onOpen={onOpenAddOn} />}
        {row.isComingSoon && (
          <Badge variant="subtle" size="status" shape="status">
            {COMPARE_COPY.soon}
          </Badge>
        )}
      </span>
    </TableHead>
    {PLAN_ORDER.map((plan) => (
      <TableCell key={plan} className="px-4 py-3">
        <CompareValue value={row.values[plan]} />
      </TableCell>
    ))}
  </TableRow>
)

const SECTION_STAGGER_MS = 45

const CompareHeaderRow = ({ currentPlanName, isExpanded }: { currentPlanName?: string; isExpanded: boolean }) => (
  <TableHeader className={cn(isExpanded && 'sticky top-0 z-10 bg-card')}>
    <TableRow className="bg-muted-secondary hover:bg-muted-secondary">
      <TableHead scope="col" className="h-11 w-[28%] px-4 py-0 align-middle font-semibold">
        {COMPARE_COPY.featureColumn}
      </TableHead>
      {PLAN_ORDER.map((plan) => {
        const isCurrent = plan === currentPlanName
        return (
          <TableHead key={plan} scope="col" className="h-11 px-4 py-0 align-middle font-semibold">
            <span className="flex items-center gap-2">
              {plan}
              {isCurrent && (
                <Badge variant="mint" size="status" shape="status">
                  {COMPARE_COPY.current}
                </Badge>
              )}
            </span>
          </TableHead>
        )
      })}
    </TableRow>
  </TableHeader>
)

/** Where each section's rows start in the whole table, so the collapsed preview counts rows across sections. */
const SECTION_FIRST_ROWS = COMPARE_SECTIONS.map((_, index) =>
  COMPARE_SECTIONS.slice(0, index).reduce((count, section) => count + section.rows.length, 0),
)
const TOTAL_ROWS = COMPARE_SECTIONS.reduce((count, section) => count + section.rows.length, 0)
const LAST_PEEK_ROW = Math.min(VISIBLE_FEATURES + PEEK_FEATURES, TOTAL_ROWS) - 1

const CompareSection = ({
  section,
  index,
  isExpanded,
  onOpenAddOn,
  lastPeekRowRef,
}: {
  section: CompareSection
  index: number
  isExpanded: boolean
  onOpenAddOn: () => void
  lastPeekRowRef?: Ref<HTMLTableRowElement>
}) => {
  const firstRow = SECTION_FIRST_ROWS[index]
  const isFoldable = firstRow > LAST_PEEK_ROW
  const isFolded = isFoldable && !isExpanded
  return (
    <TableBody
      inert={isFolded}
      aria-hidden={isFolded || undefined}
      style={{ '--section-delay': `${80 + (index - 1) * SECTION_STAGGER_MS}ms` } as CSSProperties}
      className={cn(
        index < COMPARE_SECTIONS.length - 1 && '[&_tr:last-child]:border-b',
        isFoldable && 'transition-opacity motion-reduce:transition-none',
        isFoldable &&
          (isExpanded ? 'opacity-100 duration-300 delay-(--section-delay) ease-out' : 'opacity-0 duration-150 ease-in'),
      )}
    >
      <TableRow className="bg-muted hover:bg-muted">
        <TableHead
          scope="colgroup"
          colSpan={PLAN_ORDER.length + 1}
          className="h-auto px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {section.title}
          {section.hoverEmoji && (
            <span
              aria-hidden
              className="ml-1.5 inline-block opacity-0 transition-opacity duration-200 group-hover/compare:opacity-100 motion-reduce:transition-none"
            >
              {section.hoverEmoji}
            </span>
          )}
        </TableHead>
      </TableRow>
      {section.rows.map((row, rowIndex) => (
        <CompareRow
          key={row.feature}
          ref={firstRow + rowIndex === LAST_PEEK_ROW ? lastPeekRowRef : undefined}
          row={row}
          isFolded={!isFoldable && !isExpanded && firstRow + rowIndex >= VISIBLE_FEATURES}
          onOpenAddOn={onOpenAddOn}
        />
      ))}
    </TableBody>
  )
}

export default function CompareFeaturesCard({
  currentPlanName,
  isExpanded,
  onExpandedChange,
  ref,
}: {
  /** Current plan, including free access. */
  currentPlanName?: string
  isExpanded: boolean
  onExpandedChange: (isExpanded: boolean) => void
  ref?: Ref<HTMLElement>
}) {
  const [isGuardianOpen, setGuardianOpen] = useState(false)
  const lastPeekRowRef = useRef<HTMLTableRowElement>(null)

  return (
    <section
      ref={ref}
      id={COMPARE_FEATURES_ID}
      tabIndex={-1}
      aria-labelledby="compare-features-title"
      className="scroll-mt-6 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="compare-features"
    >
      <Card radius="xl" size="none" className="group/compare overflow-clip">
        <div className="@container flex flex-col gap-2 p-2">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="compare-features-table"
            onClick={() => onExpandedChange(!isExpanded)}
            className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Typography variant="h4" id="compare-features-title">
              {COMPARE_COPY.title}
            </Typography>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4.5 transition-transform duration-[420ms] ease-soft motion-reduce:transition-none',
                  isExpanded && 'rotate-180',
                )}
              />
            </span>
          </button>

          <PeekCollapsible
            id="compare-features-table"
            open={isExpanded}
            onOpen={() => onExpandedChange(true)}
            peekUntil={lastPeekRowRef}
            expandLabel={COMPARE_COPY.showAll}
            className="rounded-xl bg-card @2xl:[&_[data-slot=table-container]]:overflow-visible"
          >
            <Table className="min-w-160 table-fixed">
              <CompareHeaderRow currentPlanName={currentPlanName} isExpanded={isExpanded} />
              {COMPARE_SECTIONS.map((section, index) => (
                <CompareSection
                  key={section.title}
                  lastPeekRowRef={lastPeekRowRef}
                  section={section}
                  index={index}
                  isExpanded={isExpanded}
                  onOpenAddOn={() => setGuardianOpen(true)}
                />
              ))}
            </Table>
          </PeekCollapsible>
        </div>
      </Card>
      <HnSignupFlow open={isGuardianOpen} onClose={() => setGuardianOpen(false)} />
    </section>
  )
}
