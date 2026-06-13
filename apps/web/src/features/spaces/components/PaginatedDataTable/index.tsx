import { useEffect, useState, type ReactNode } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type DataTableColumn = {
  /** Stable identifier used as the React key for the header cell */
  id: string
  header?: ReactNode
  /** Utility classes applied to the column's `<TableHead>` (e.g. width) */
  className?: string
}

const DEFAULT_PAGE_SIZE = 25

type PaginatedDataTableProps<T> = {
  columns: DataTableColumn[]
  rows: T[]
  /** Renders the `<TableCell>`s for a single row */
  renderRow: (row: T) => ReactNode
  getRowKey: (row: T) => string
  getRowClassName?: (row: T) => string
  pageSize?: number
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

  useEffect(() => {
    setPage(0)
  }, [rows])

  const totalPages = Math.ceil(rows.length / pageSize)
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={cn('text-muted-foreground', column.className)}>
                {column.header}
              </TableHead>
            ))}
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
            {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
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
