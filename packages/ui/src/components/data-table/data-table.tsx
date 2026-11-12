import { Fragment, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { ChevronDown, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortIcon,
} from '../../primitives/table/table'
import { Button } from '../../primitives/button/button'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'

// Columns pick from bounded variant axes, never raw className/style, so tables cannot drift.
const columnAlign = { start: 'text-left', center: 'text-center', end: 'text-right' } as const

const tableHeadVariants = cva('text-muted-foreground', {
  variants: { align: columnAlign },
  defaultVariants: { align: 'start' },
})

const tableCellVariants = cva('', {
  variants: {
    align: columnAlign,
    emphasis: { default: '', strong: 'font-bold' },
  },
  defaultVariants: { align: 'start', emphasis: 'default' },
})

// Desktop column widths (md+) bounded to a shared scale; mobile auto-sizes.
const COLUMN_WIDTHS = {
  '10%': 'md:w-[10%]',
  '15%': 'md:w-[15%]',
  '20%': 'md:w-[20%]',
  '30%': 'md:w-[30%]',
  '35%': 'md:w-[35%]',
  '40%': 'md:w-[40%]',
  fit: 'md:w-[var(--col-min-w)]',
} as const

export type ColumnWidth = keyof typeof COLUMN_WIDTHS

export type DataTableColumn<T> = {
  /** Stable identifier used as the React key and for sort state */
  id: string
  header?: ReactNode
  /** Renders the cell content inside the table's `<TableCell>`; `isCompact` is true in the compact (mobile) layout */
  cell: (row: T, context: { isCompact: boolean }) => ReactNode
  /** `data-testid` applied to the column's body `<TableCell>` */
  cellTestId?: string
  /** Horizontal alignment of the header and cell content */
  align?: 'start' | 'center' | 'end'
  /** Visual emphasis of the cell content */
  emphasis?: 'default' | 'strong'
  /** Desktop column width, bounded to the shared scale (mobile auto-sizes); `fit` requires `minWidth` */
  width?: ColumnWidth
  /** `secondary` columns are dropped in the compact layout (mobile viewport or too-narrow container) */
  priority?: 'essential' | 'secondary'
  /** Pins the column to the left while horizontally scrolling on mobile */
  sticky?: boolean
  /** Lowest acceptable width in px; the summed minimums are the floor below which the table goes compact */
  minWidth?: number
  /** When provided, the column header becomes sortable using this comparable value */
  sortValue?: (row: T) => string | number | null | undefined
}

type SortDirection = 'asc' | 'desc'
type SortState = { id: string; direction: SortDirection }

const DEFAULT_PAGE_SIZE = 25

const NESTED_CONTROLS = 'a, button, [role="button"], input, [role="menuitem"]'

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  /** Makes the row a pointer target; render a focusable, named control in a cell too, as the row stays a plain row for assistive tech. Nested links and buttons keep their own clicks */
  onRowClick?: (row: T) => void
  rows: T[]
  /** Optional mobile-only collapsible detail row, revealed per row via a toggle */
  renderRowDetail?: (row: T) => ReactNode
  getRowKey: (row: T) => string
  getRowClassName?: (row: T) => string
  pageSize?: number
}

// Hides secondary columns on small viewports before useIsMobile resolves on the first render.
const hideClass = <T,>(column: DataTableColumn<T>) =>
  column.priority === 'secondary' ? 'max-[767px]:hidden md:table-cell' : ''

// minWidth is a desktop-only floor; mobile auto-sizes to content
const minWidthClass = <T,>(column: DataTableColumn<T>) => (column.minWidth ? 'md:min-w-[var(--col-min-w)]' : '')

const minWidthStyle = <T,>(column: DataTableColumn<T>): Record<string, string> | undefined =>
  column.minWidth ? { '--col-min-w': `${column.minWidth}px` } : undefined

const compareNullable = (
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  factor: number,
) => {
  // Empty values sort last in both directions
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (a < b) return -1 * factor
  if (a > b) return factor
  return 0
}

const ariaSortValue = (direction?: SortDirection): 'ascending' | 'descending' | 'none' =>
  direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'

/**
 * DataTable
 *
 * A typed, sortable and paginated table on the panel look of `Table`. Columns pick their look from bounded
 * options, and secondary columns fold into an optional detail row when the full set doesn't fit.
 *
 * @example
 * ```tsx
 * <DataTableCard>
 *   <DataTable columns={columns} rows={members} getRowKey={(member) => member.id} />
 * </DataTableCard>
 * ```
 */
function DataTable<T>({
  columns,
  rows,
  renderRowDetail,
  getRowKey,
  getRowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
  onRowClick,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  // Without ResizeObserver (jsdom) compact mode is viewport-only
  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Keyed by row identity, so an equivalent `rows` array from a re-render keeps the page.
  const rowsKey = rows.map(getRowKey).join('\u0000')
  const [prevRowsKey, setPrevRowsKey] = useState(rowsKey)

  // A new data set starts over at page one, adjusted during render so the stale page never commits.
  if (rowsKey !== prevRowsKey) {
    setPrevRowsKey(rowsKey)
    setPage(0)
    setExpanded(new Set())
  }

  // asc → desc → unsorted on repeated clicks of the same header
  const handleSort = (columnId: string) => {
    setPage(0)
    setSort((current) => {
      if (current?.id !== columnId) return { id: columnId, direction: 'asc' }
      if (current.direction === 'asc') return { id: columnId, direction: 'desc' }
      return null
    })
  }

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const sortValue = columns.find((column) => column.id === sort.id)?.sortValue
    if (!sortValue) return rows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => compareNullable(sortValue(a), sortValue(b), factor))
  }, [rows, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  // Clamped so a shrinking data set never strands the user on an empty page
  const currentPage = Math.min(page, totalPages - 1)
  const paginatedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  // Fixed layout ignores cell `min-width`, so below this floor the full column set would overlap.
  const tableMinWidth = columns.reduce((total, column) => total + (column.minWidth ?? 0), 0)

  // Compact: the full column set doesn't fit, so secondary columns fold into the row detail.
  const isCompact = isMobile || (containerWidth !== null && containerWidth < tableMinWidth)
  const visibleColumns = isCompact ? columns.filter((column) => column.priority !== 'secondary') : columns

  const showDetailToggle = isCompact && Boolean(renderRowDetail)
  const totalColumns = visibleColumns.length + (showDetailToggle ? 1 : 0)

  const toggleExpanded = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div ref={containerRef} data-slot="data-table" data-testid="table-container">
      <Table variant="panel" className={cn(!isCompact && 'md:table-fixed')}>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => {
              const direction = sort?.id === column.id ? sort.direction : undefined

              return (
                <TableHead
                  key={column.id}
                  data-sticky={column.sticky ? '' : undefined}
                  aria-sort={column.sortValue ? ariaSortValue(direction) : undefined}
                  style={isCompact ? undefined : minWidthStyle(column)}
                  className={cn(
                    tableHeadVariants({ align: column.align }),
                    hideClass(column),
                    !isCompact && minWidthClass(column),
                    !isCompact && column.width && COLUMN_WIDTHS[column.width],
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id)}
                      className="hover:text-foreground group/sort inline-flex cursor-pointer items-center gap-1"
                    >
                      {column.header}
                      <TableSortIcon direction={direction} />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
            {showDetailToggle && <TableHead className="w-8" aria-hidden="true" />}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedRows.map((row) => {
            const key = getRowKey(row)
            const isOpen = expanded.has(key)
            const detailId = `data-table-detail-${key}`
            // An expanded row hands its divider to the detail row below it.
            const showDetail = showDetailToggle && isOpen

            return (
              <Fragment key={key}>
                <TableRow
                  data-testid="table-row"
                  data-no-divider={showDetail ? '' : undefined}
                  className={cn(getRowClassName?.(row), onRowClick && 'cursor-pointer')}
                  onClick={
                    onRowClick
                      ? (event) => {
                          if ((event.target as HTMLElement).closest(NESTED_CONTROLS)) return
                          onRowClick(row)
                        }
                      : undefined
                  }
                >
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      data-sticky={column.sticky ? '' : undefined}
                      data-testid={column.cellTestId}
                      style={isCompact ? undefined : minWidthStyle(column)}
                      className={cn(
                        tableCellVariants({ align: column.align, emphasis: column.emphasis }),
                        hideClass(column),
                        !isCompact && minWidthClass(column),
                        isCompact && 'whitespace-normal wrap-anywhere',
                      )}
                    >
                      {column.cell(row, { isCompact })}
                    </TableCell>
                  ))}
                  {showDetailToggle && (
                    <TableCell className="w-8 p-0 text-right align-middle">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? detailId : undefined}
                        aria-label={isOpen ? 'Hide details' : 'Show details'}
                        onClick={() => toggleExpanded(key)}
                      >
                        <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>

                {showDetail && (
                  <TableRow className={getRowClassName?.(row)}>
                    <TableCell
                      id={detailId}
                      colSpan={totalColumns}
                      className="bg-muted/30 whitespace-normal wrap-anywhere"
                    >
                      {renderRowDetail?.(row)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-muted-foreground text-sm">
            {currentPage * pageSize + 1}&ndash;{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              data-testid="prev-page-btn"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              data-testid="next-page-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** The rounded card surface for a table and its states; the table brings its own edge insets */
function DataTableCard({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="data-table-card" className={cn('bg-card rounded-lg pb-2', className)} {...props} />
}

export { DataTable, DataTableCard }
export type { DataTableProps }
