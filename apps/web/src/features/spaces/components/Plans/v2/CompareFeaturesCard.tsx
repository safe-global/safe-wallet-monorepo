import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { HnSignupFlow } from '@/features/hypernative'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { cn } from '@/utils/cn'
import {
  COMPARE_COPY_V2,
  COMPARE_SECTIONS_V2,
  type CompareRowV2,
  type CompareValueV2,
  PLAN_ORDER,
  type CompareSectionV2,
} from '../planCatalog'
import { FeatureCheck } from './FeatureCheck'

export const COMPARE_FEATURES_ID = 'compare-features'
const TABLE_ID = `${COMPARE_FEATURES_ID}-table`
const TITLE_ID = `${COMPARE_FEATURES_ID}-title`
const PLANS = PLAN_ORDER

/** Collapsed, the table shows this many features clearly and the next few fading out under the button. */
export const VISIBLE_FEATURES = 5
const PEEK_FEATURES = 2

const CompareValue = ({ value, isCurrent }: { value: CompareValueV2; isCurrent: boolean }) => {
  if (value === true) {
    return (
      <>
        <FeatureCheck isEmphasized={isCurrent} />
        <span className="sr-only">{COMPARE_COPY_V2.included}</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden className="text-muted-foreground">
          —
        </span>
        <span className="sr-only">{COMPARE_COPY_V2.notIncluded}</span>
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

const ADD_ON_ARROW_EASE = 'duration-300 ease-soft motion-reduce:transition-none'

/** A plan's add-on value, opening the Guardian signup; an arrow slides in while it is hovered or focused. */
const AddOnLink = ({ label, onOpen }: { label: string; onOpen: () => void }) => (
  <Link
    render={<button type="button" />}
    className="group/add-on inline-flex items-center font-semibold"
    onClick={() => {
      trackDiscussAddOn()
      onOpen()
    }}
  >
    {label}
    <span
      aria-hidden
      className={cn(
        'inline-flex w-0 overflow-hidden opacity-0 transition-[width,margin,opacity]',
        'group-hover/add-on:ml-1 group-hover/add-on:w-4 group-hover/add-on:opacity-100',
        'group-focus-visible/add-on:ml-1 group-focus-visible/add-on:w-4 group-focus-visible/add-on:opacity-100',
        ADD_ON_ARROW_EASE,
      )}
    >
      <ArrowUpRight
        className={cn(
          'size-4 -translate-x-1 transition-transform group-hover/add-on:translate-x-0 group-focus-visible/add-on:translate-x-0',
          ADD_ON_ARROW_EASE,
        )}
      />
    </span>
  </Link>
)

const CompareRow = ({
  row,
  currentPlanName,
  isFolded,
  isExpanded,
  onOpenAddOn,
  ref,
}: {
  row: CompareRowV2
  currentPlanName?: string
  isFolded: boolean
  isExpanded: boolean
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
        {row.isComingSoon && (
          <Badge variant="subtle" size="status" shape="status">
            {COMPARE_COPY_V2.soon}
          </Badge>
        )}
      </span>
    </TableHead>
    {PLANS.map((plan) => (
      <TableCell key={plan} className="px-4 py-3">
        {row.isAddOn && typeof row.values[plan] === 'string' ? (
          <AddOnLink label={row.values[plan]} onOpen={onOpenAddOn} />
        ) : (
          <CompareValue value={row.values[plan]} isCurrent={isExpanded && plan === currentPlanName} />
        )}
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
        {COMPARE_COPY_V2.featureColumn}
      </TableHead>
      {PLANS.map((plan) => {
        const isCurrent = plan === currentPlanName
        return (
          <TableHead key={plan} scope="col" className="h-11 px-4 py-0 align-middle font-semibold">
            <span className="flex items-center gap-2">
              {plan}
              {isCurrent && (
                <Badge variant="mint" size="status" shape="status">
                  {COMPARE_COPY_V2.current}
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
const SECTION_FIRST_ROWS = COMPARE_SECTIONS_V2.map((_, index) =>
  COMPARE_SECTIONS_V2.slice(0, index).reduce((count, section) => count + section.rows.length, 0),
)
const TOTAL_ROWS = COMPARE_SECTIONS_V2.reduce((count, section) => count + section.rows.length, 0)
const LAST_PEEK_ROW = Math.min(VISIBLE_FEATURES + PEEK_FEATURES, TOTAL_ROWS) - 1

const CompareSection = ({
  section,
  index,
  isExpanded,
  currentPlanName,
  onOpenAddOn,
  lastPeekRowRef,
}: {
  section: CompareSectionV2
  index: number
  isExpanded: boolean
  currentPlanName?: string
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
        index < COMPARE_SECTIONS_V2.length - 1 && '[&_tr:last-child]:border-b',
        isFoldable && 'transition-opacity motion-reduce:transition-none',
        isFoldable &&
          (isExpanded ? 'opacity-100 duration-300 delay-(--section-delay) ease-out' : 'opacity-0 duration-150 ease-in'),
      )}
    >
      <TableRow className="bg-muted hover:bg-muted">
        <TableHead
          scope="colgroup"
          colSpan={PLANS.length + 1}
          className="h-auto px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {section.title}
        </TableHead>
      </TableRow>
      {section.rows.map((row, rowIndex) => (
        <CompareRow
          key={row.feature}
          ref={firstRow + rowIndex === LAST_PEEK_ROW ? lastPeekRowRef : undefined}
          row={row}
          currentPlanName={currentPlanName}
          isFolded={!isFoldable && !isExpanded && firstRow + rowIndex >= VISIBLE_FEATURES}
          isExpanded={isExpanded}
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
      aria-labelledby={TITLE_ID}
      className="scroll-mt-6 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="compare-features"
    >
      <Card radius="xl" size="none" className="overflow-clip">
        <div className="flex flex-col gap-2 p-2">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={TABLE_ID}
            onClick={() => onExpandedChange(!isExpanded)}
            className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex flex-col gap-0.5">
              <Typography variant="h4" id={TITLE_ID}>
                {COMPARE_COPY_V2.title}
              </Typography>
              <Typography variant="paragraph-small" color="muted">
                {COMPARE_COPY_V2.subtitle}
              </Typography>
            </span>
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
              id={TABLE_ID}
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
                {COMPARE_SECTIONS_V2.map((section, index) => (
                  <CompareSection
                    key={section.title}
                    lastPeekRowRef={lastPeekRowRef}
                    section={section}
                    index={index}
                    isExpanded={isExpanded}
                    currentPlanName={currentPlanName}
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
                'absolute inset-x-0 bottom-0 flex h-28 items-end justify-center rounded-b-xl pb-5 transition-opacity duration-300 ease-soft motion-reduce:transition-none',
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
                {COMPARE_COPY_V2.showAll}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <HnSignupFlow open={isGuardianOpen} onClose={() => setGuardianOpen(false)} />
    </section>
  )
}
