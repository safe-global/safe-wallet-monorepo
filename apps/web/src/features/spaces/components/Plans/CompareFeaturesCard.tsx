import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
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

export const COMPARE_FEATURES_ID = 'compare-features'

/** Collapsed, only the coming-soon rows show in full; the next row fades out under the button. */
export const VISIBLE_FEATURES = COMPARE_SECTIONS[0].rows.length
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

const HEIGHT_TRANSITION = {
  expand: 'transition-[height] duration-[420ms] ease-soft',
  collapse: 'transition-[height] duration-[320ms] ease-in-out',
}
const SECTION_STAGGER_MS = 45

type TableHeights = { collapsed: number; full: number }

/** Full height, and the height down to the last peeking row, of the table's scroll container. */
const useTableHeights = (
  tableRef: RefObject<HTMLTableElement | null>,
  lastPeekRowRef: RefObject<HTMLTableRowElement | null>,
  isExpanded: boolean,
): TableHeights | undefined => {
  const [heights, setHeights] = useState<TableHeights>()

  useLayoutEffect(() => {
    const table = tableRef.current
    const lastPeekRow = lastPeekRowRef.current
    const container = table?.parentElement
    if (!table || !lastPeekRow || !container) return
    const measure = () => {
      const full = container.offsetHeight
      const rowBottom = lastPeekRow.getBoundingClientRect().bottom - table.getBoundingClientRect().top
      // 0 means not laid out yet (e.g. jsdom), so don't clip.
      setHeights(full > 0 ? { full, collapsed: Math.min(rowBottom, full) } : undefined)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(table)
    return () => observer.disconnect()
  }, [tableRef, lastPeekRowRef, isExpanded])

  return heights
}

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
  const tableRef = useRef<HTMLTableElement>(null)
  const lastPeekRowRef = useRef<HTMLTableRowElement>(null)
  const heights = useTableHeights(tableRef, lastPeekRowRef, isExpanded)
  const tableStyle: CSSProperties | undefined = heights
    ? { height: isExpanded ? heights.full : heights.collapsed }
    : undefined

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
        <div className="flex flex-col gap-2 p-2">
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

          <div className="@container relative">
            <div
              id="compare-features-table"
              data-testid="compare-features-table"
              style={tableStyle}
              className={cn(
                // `clip`, not `hidden`, so the sticky header follows the page scroll; it can only once the table fits.
                'overflow-clip rounded-xl bg-card motion-reduce:transition-none @2xl:[&_[data-slot=table-container]]:overflow-visible',
                isExpanded ? HEIGHT_TRANSITION.expand : HEIGHT_TRANSITION.collapse,
              )}
            >
              <Table ref={tableRef} className="min-w-160 table-fixed">
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
            </div>

            <div
              inert={isExpanded}
              aria-hidden={isExpanded || undefined}
              data-testid="compare-features-fade"
              className={cn(
                'absolute inset-x-0 bottom-0 flex h-20 items-end justify-center rounded-b-xl pb-3 transition-opacity duration-300 ease-soft motion-reduce:transition-none',
                isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100',
              )}
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-b-xl bg-linear-to-b from-card/0 to-card backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,transparent,black_45%)]"
              />
              <Button
                variant="outline"
                size="sm"
                weight="semibold"
                className="relative"
                onClick={() => onExpandedChange(true)}
              >
                {COMPARE_COPY.showAll}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <HnSignupFlow open={isGuardianOpen} onClose={() => setGuardianOpen(false)} />
    </section>
  )
}
