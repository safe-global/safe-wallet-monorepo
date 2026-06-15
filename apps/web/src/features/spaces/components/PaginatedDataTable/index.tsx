import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type DataTableColumn<T> = {
  /** Stable identifier used as the React key and passed back to `renderCell` */
  id: string
  header?: ReactNode
  /** Utility classes applied to the column's `<TableHead>` (e.g. alignment) */
  className?: string
  /** Utility classes applied to the column's body `<TableCell>` */
  cellClassName?: string
  /** `data-testid` applied to the column's body `<TableCell>` */
  cellTestId?: string
  /** `secondary` columns are hidden below the mobile breakpoint (768px) */
  priority?: 'essential' | 'secondary'
  /** Pins the column to the left while horizontally scrolling on mobile */
  sticky?: boolean
  /** Minimum column width in px — a floor for the content-based auto layout */
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
  /** Renders the content of a single column's cell; the table owns the `<TableCell>` wrapper */
  renderCell: (row: T, column: DataTableColumn<T>) => ReactNode
  /** Optional mobile-only collapsible detail row, revealed per row via a toggle */
  renderRowDetail?: (row: T) => ReactNode
  getRowKey: (row: T) => string
  getRowClassName?: (row: T) => string
  pageSize?: number
}

// Secondary columns drop out below 768px (matches useIsMobile's breakpoint)
const hideClass = <T,>(column: DataTableColumn<T>) =>
  column.priority === 'secondary' ? 'max-[767px]:hidden md:table-cell' : ''

// Sticky only kicks in on mobile, where the table can scroll horizontally
const stickyClass = <T,>(column: DataTableColumn<T>) =>
  column.sticky ? 'max-[767px]:bg-card max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-10' : ''

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
  renderCell,
  renderRowDetail,
  getRowKey,
  getRowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginatedDataTableProps<T>) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

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

  // Secondary columns (and their sort headers) are hidden on mobile; sorting there
  // happens via the visible column headers, so no separate mobile sort control is needed.
  const showDetailToggle = isMobile && Boolean(renderRowDetail)
  const totalColumns = columns.length + (showDetailToggle ? 1 : 0)

  const toggleExpanded = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <>
      {/* Fixed layout on desktop preserves column proportions and lets `truncate` cells clip;
          on mobile the table falls back to auto layout so sticky/min-width columns size to content. */}
      <Table className="md:table-fixed">
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const direction = sort?.id === column.id ? sort.direction : undefined

              return (
                <TableHead
                  key={column.id}
                  aria-sort={column.sortValue ? ariaSortValue(direction) : undefined}
                  style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                  className={cn('text-muted-foreground', hideClass(column), stickyClass(column), column.className)}
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
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      data-testid={column.cellTestId}
                      style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                      className={cn(column.cellClassName, hideClass(column), stickyClass(column))}
                    >
                      {renderCell(row, column)}
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
    </>
  )
}

export default PaginatedDataTable
