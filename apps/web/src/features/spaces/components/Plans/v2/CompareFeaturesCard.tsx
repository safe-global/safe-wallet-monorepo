import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
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
const PLANS = PLAN_ORDER

const tint = (isCurrent: boolean) => isCurrent && 'bg-mint/25'

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

const CompareRow = ({ row, currentPlan }: { row: CompareRowV2; currentPlan?: string }) => (
  <TableRow className="hover:bg-transparent">
    <TableHead scope="row" className="h-auto px-4 py-3 font-normal">
      <span className="flex items-center gap-2">
        {row.feature}
        {row.isComingSoon && (
          <Badge variant="mint" size="status" shape="status">
            {COMPARE_COPY_V2.soon}
          </Badge>
        )}
      </span>
    </TableHead>
    {PLANS.map((plan) => (
      <TableCell key={plan} className={cn('px-4 py-3', tint(plan === currentPlan))}>
        {row.values ? (
          <CompareValue value={row.values[plan]} isCurrent={plan === currentPlan} />
        ) : (
          <span className="sr-only">{COMPARE_COPY_V2.soon}</span>
        )}
      </TableCell>
    ))}
  </TableRow>
)

const HEIGHT_TRANSITION = {
  expand: 'transition-[height] duration-[420ms] ease-soft',
  collapse: 'transition-[height] duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
}
const SECTION_STAGGER_MS = 45

type TableHeights = { collapsed: number; full: number }

/** Full and header-plus-first-section heights of the table's scroll container, so a horizontal scrollbar is never clipped. */
const useTableHeights = (
  tableRef: RefObject<HTMLTableElement | null>,
  firstSectionRef: RefObject<HTMLTableSectionElement | null>,
  isExpanded: boolean,
): TableHeights | undefined => {
  const [heights, setHeights] = useState<TableHeights>()

  useLayoutEffect(() => {
    const table = tableRef.current
    const firstSection = firstSectionRef.current
    const container = table?.parentElement
    if (!table || !firstSection || !container) return
    const measure = () => {
      const full = container.offsetHeight
      // 0 means not laid out yet (e.g. jsdom), so don't clip.
      setHeights(full > 0 ? { full, collapsed: firstSection.offsetTop + firstSection.offsetHeight } : undefined)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(table)
    return () => observer.disconnect()
  }, [tableRef, firstSectionRef, isExpanded])

  return heights
}

const CompareHeaderRow = ({ currentPlan }: { currentPlan?: string }) => (
  <TableHeader>
    <TableRow className="bg-muted-secondary hover:bg-muted-secondary">
      <TableHead scope="col" className="h-auto w-[34%] px-4 py-2.5 font-semibold">
        {COMPARE_COPY_V2.featureColumn}
      </TableHead>
      {PLANS.map((plan) => (
        <TableHead
          key={plan}
          scope="col"
          className={cn('h-auto px-4 py-2.5 font-semibold', tint(plan === currentPlan))}
        >
          <span className="flex items-center gap-2">
            {plan}
            {plan === currentPlan && (
              <Badge variant="mint" size="status" shape="status">
                {COMPARE_COPY_V2.current}
              </Badge>
            )}
          </span>
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>
)

const CompareSection = ({
  section,
  index,
  isExpanded,
  currentPlan,
  ref,
}: {
  section: CompareSectionV2
  index: number
  isExpanded: boolean
  currentPlan?: string
  ref?: Ref<HTMLTableSectionElement>
}) => {
  const isFoldable = index > 0
  const isFolded = isFoldable && !isExpanded
  return (
    <TableBody
      ref={ref}
      inert={isFolded}
      aria-hidden={isFolded || undefined}
      style={{ '--section-delay': `${80 + (index - 1) * SECTION_STAGGER_MS}ms` } as CSSProperties}
      className={cn(
        '[&_tr:last-child]:border-b',
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
      {section.rows.map((row) => (
        <CompareRow key={row.feature} row={row} currentPlan={currentPlan} />
      ))}
    </TableBody>
  )
}

export default function CompareFeaturesCard({
  currentPlan,
  isExpanded,
  onExpandedChange,
  ref,
}: {
  /** Current plan, including free access. */
  currentPlan?: string
  isExpanded: boolean
  onExpandedChange: (isExpanded: boolean) => void
  ref?: Ref<HTMLElement>
}) {
  const tableRef = useRef<HTMLTableElement>(null)
  const firstSectionRef = useRef<HTMLTableSectionElement>(null)
  const heights = useTableHeights(tableRef, firstSectionRef, isExpanded)
  const tableStyle: CSSProperties | undefined = heights
    ? { height: isExpanded ? heights.full : heights.collapsed }
    : undefined

  return (
    <section
      ref={ref}
      id={COMPARE_FEATURES_ID}
      tabIndex={-1}
      aria-labelledby={`${COMPARE_FEATURES_ID}-title`}
      className="scroll-mt-6 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="compare-features"
    >
      <Card radius="xl" size="none">
        <div className="flex flex-col p-2">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={TABLE_ID}
              onClick={() => onExpandedChange(!isExpanded)}
              className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex flex-col gap-0.5">
                <Typography variant="h4" id={`${COMPARE_FEATURES_ID}-title`}>
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

            <div
              id={TABLE_ID}
              data-testid="compare-features-table"
              style={tableStyle}
              className={cn(
                'overflow-hidden rounded-xl bg-card motion-reduce:transition-none',
                isExpanded ? HEIGHT_TRANSITION.expand : HEIGHT_TRANSITION.collapse,
              )}
            >
              <Table ref={tableRef} className="min-w-160 table-fixed">
                <CompareHeaderRow currentPlan={currentPlan} />
                {COMPARE_SECTIONS_V2.map((section, index) => (
                  <CompareSection
                    key={section.title}
                    ref={index === 0 ? firstSectionRef : undefined}
                    section={section}
                    index={index}
                    isExpanded={isExpanded}
                    currentPlan={currentPlan}
                  />
                ))}
              </Table>
            </div>
          </div>

          <div
            inert={isExpanded}
            aria-hidden={isExpanded || undefined}
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-soft motion-reduce:transition-none',
              isExpanded ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
            )}
          >
            <div className="overflow-hidden">
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  weight="semibold"
                  className="w-full"
                  onClick={() => onExpandedChange(true)}
                >
                  {COMPARE_COPY_V2.showAll}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
