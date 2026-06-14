import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type DataTableColumn<T> = {
  /** Stable identifier used as the React key for the header cell */
  id: string
  header?: ReactNode
  /** Utility classes applied to the column's `<TableHead>` (e.g. width) */
  className?: string
  /** When provided, the column header becomes sortable using this comparable value */
  sortValue?: (row: T) => string | number | null | undefined
}

type SortDirection = 'asc' | 'desc'
type SortState = { id: string; direction: SortDirection }

const DEFAULT_PAGE_SIZE = 25

type PaginatedDataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Renders the `<TableCell>`s for a single row */
  renderRow: (row: T) => ReactNode
  getRowKey: (row: T) => string
  getRowClassName?: (row: T) => string
  pageSize?: number
}

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
  renderRow,
  getRowKey,
  getRowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginatedDataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState | null>(null)

  // Jump back to the first page when the data set changes (e.g. a new search/filter)
  useEffect(() => {
    setPage(0)
  }, [rows])

  // Cycle through asc → desc → unsorted on repeated clicks of the same column
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

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const direction = sort?.id === column.id ? sort.direction : undefined

              return (
                <TableHead
                  key={column.id}
                  aria-sort={column.sortValue ? ariaSortValue(direction) : undefined}
                  className={cn('text-muted-foreground', column.className)}
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
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedRows.map((row) => (
            <TableRow key={getRowKey(row)} className={getRowClassName?.(row)}>
              {renderRow(row)}
            </TableRow>
          ))}
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
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
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
