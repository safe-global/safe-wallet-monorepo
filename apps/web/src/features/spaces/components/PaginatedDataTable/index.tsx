import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

// Bounded design-system styling for columns. Consumers pick from these variant
// axes — they never pass raw className/style — so no table can drift on color,
// font, radius, or alignment. (Promoting these onto the shared ui/table.tsx
// primitive, app-wide, is the follow-up step.)
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

// Desktop column widths bounded to a shared scale (applied at md+; mobile auto-sizes).
// A new width is a deliberate addition here, not an arbitrary class at the call site.
const COLUMN_WIDTHS = {
  '10%': 'md:w-[10%]',
  '15%': 'md:w-[15%]',
  '20%': 'md:w-[20%]',
  '30%': 'md:w-[30%]',
  '35%': 'md:w-[35%]',
  '40%': 'md:w-[40%]',
} as const

export type ColumnWidth = keyof typeof COLUMN_WIDTHS

export type DataTableColumn<T> = {
  /** Stable identifier used as the React key and for sort state */
  id: string
  header?: ReactNode
  /**
   * Renders the content of this column's cell; the table owns the `<TableCell>` wrapper.
   * `context.isCompact` is true when the table renders its compact (mobile-style) layout.
   */
  cell: (row: T, context: { isCompact: boolean }) => ReactNode
  /** `data-testid` applied to the column's body `<TableCell>` */
  cellTestId?: string
  /** Horizontal alignment of the header and cell content */
  align?: 'start' | 'center' | 'end'
  /** Visual emphasis of the cell content */
  emphasis?: 'default' | 'strong'
  /** Desktop column width, bounded to the shared scale (mobile auto-sizes) */
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

type PaginatedDataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Optional mobile-only collapsible detail row, revealed per row via a toggle */
  renderRowDetail?: (row: T) => ReactNode
  getRowKey: (row: T) => string
  getRowClassName?: (row: T) => string
  pageSize?: number
}

// Flash guard: hides secondary columns on small viewports during the first render,
// before useIsMobile resolves and compact mode drops them from the DOM.
const hideClass = <T,>(column: DataTableColumn<T>) =>
  column.priority === 'secondary' ? 'max-[767px]:hidden md:table-cell' : ''

// Sticky only kicks in on mobile, where the table can scroll horizontally
const stickyClass = <T,>(column: DataTableColumn<T>) =>
  column.sticky ? 'max-[767px]:bg-card max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-10' : ''

// minWidth is a desktop-only floor; mobile auto-sizes to content
const minWidthClass = <T,>(column: DataTableColumn<T>) => (column.minWidth ? 'md:min-w-[var(--col-min-w)]' : '')

const minWidthStyle = <T,>(column: DataTableColumn<T>): Record<string, string> | undefined =>
  column.minWidth ? { '--col-min-w': `${column.minWidth}px` } : undefined

const compareNullable = (
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  factor: number,
) => {
  // Empty values always sort to the end, regardless of direction
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (a < b) return -1 * factor
  if (a > b) return factor
  return 0
}

const ariaSortValue = (direction?: SortDirection): 'ascending' | 'descending' | 'none' =>
  direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'

const SortIcon = ({ direction }: { direction?: SortDirection }) => {
  if (direction === 'asc') return <ArrowUp className="size-3.5" />
  if (direction === 'desc') return <ArrowDown className="size-3.5" />
  return <ArrowUpDown className="size-3.5 opacity-50" />
}

function PaginatedDataTable<T>({
  columns,
  rows,
  renderRowDetail,
  getRowKey,
  getRowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginatedDataTableProps<T>) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  // Guarded for environments without ResizeObserver (jsdom) — there compact mode is viewport-only
  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Jump back to the first page when the data set changes (e.g. a new search/filter)
  useEffect(() => {
    setPage(0)
    setExpanded(new Set())
  }, [rows])

  // Cycle through asc → desc → unsorted on repeated clicks of the same column header
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
  // Clamp so a shrinking data set can never strand the user on an empty page
  const currentPage = Math.min(page, totalPages - 1)
  const paginatedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  // Fixed table layout ignores `min-width` on cells, so below this floor the full column set
  // cannot render without columns overlapping.
  const tableMinWidth = columns.reduce((total, column) => total + (column.minWidth ?? 0), 0)

  // Compact = the full column set doesn't fit: render the mobile presentation
  // — secondary columns fold into the row detail.
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
    <div ref={containerRef}>
      {/* Fixed layout on regular desktop preserves column proportions and lets `truncate` cells
          clip; compact mode falls back to auto layout so the remaining columns size to content. */}
      <Table className={cn(!isCompact && 'md:table-fixed')}>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => {
              const direction = sort?.id === column.id ? sort.direction : undefined

              return (
                <TableHead
                  key={column.id}
                  aria-sort={column.sortValue ? ariaSortValue(direction) : undefined}
                  style={isCompact ? undefined : minWidthStyle(column)}
                  className={cn(
                    tableHeadVariants({ align: column.align }),
                    hideClass(column),
                    stickyClass(column),
                    !isCompact && minWidthClass(column),
                    !isCompact && column.width && COLUMN_WIDTHS[column.width],
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id)}
                      className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 font-medium"
                    >
                      {column.header}
                      <SortIcon direction={direction} />
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

            return (
              <Fragment key={key}>
                <TableRow className={getRowClassName?.(row)}>
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      data-testid={column.cellTestId}
                      style={isCompact ? undefined : minWidthStyle(column)}
                      className={cn(
                        tableCellVariants({ align: column.align, emphasis: column.emphasis }),
                        hideClass(column),
                        stickyClass(column),
                        !isCompact && minWidthClass(column),
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

                {showDetailToggle && isOpen && (
                  <TableRow className={getRowClassName?.(row)}>
                    <TableCell id={detailId} colSpan={totalColumns} className="bg-muted/30">
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
        <div className="flex items-center justify-between pt-4 pr-16">
          <p className="text-muted-foreground text-sm">
            {currentPage * pageSize + 1}&ndash;{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
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

export default PaginatedDataTable
