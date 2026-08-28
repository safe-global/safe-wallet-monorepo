import type { ReactNode } from 'react'
import React, { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import classNames from 'classnames'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

type SortDirection = 'asc' | 'desc'

type EnhancedCell = {
  content: ReactNode
  rawValue: string | number | null
  sticky?: boolean
}

type EnhancedRow = {
  selected?: boolean
  key?: string
  cells: Record<string, EnhancedCell>
}

type EnhancedHeadCell = {
  id: string
  label: ReactNode
  width?: string
  align?: string
  sticky?: boolean
  disableSort?: boolean
}

function descendingComparator(a: string | number, b: string | number) {
  if (b < a) {
    return -1
  }
  if (b > a) {
    return 1
  }
  return 0
}

function getComparator(order: SortDirection, orderBy: string) {
  return (a: EnhancedRow, b: EnhancedRow) => {
    const aValue = a.cells[orderBy].rawValue
    const bValue = b.cells[orderBy].rawValue

    // Handle null/undefined values - always sort to end
    if (aValue == null) return 1
    if (bValue == null) return -1
    if (aValue == null && bValue == null) return 0

    // Use existing comparator for non-null values
    return order === 'desc' ? descendingComparator(aValue, bValue) : -descendingComparator(aValue, bValue)
  }
}

type EnhancedTableHeadProps = {
  headCells: EnhancedHeadCell[]
  onRequestSort: (property: string) => void
  order: SortDirection
  orderBy: string
  panel?: boolean
}

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const { headCells, order, orderBy, onRequestSort, panel } = props
  const createSortHandler = (property: string) => () => {
    onRequestSort(property)
  }

  return (
    <TableHeader>
      <TableRow>
        {headCells.map((headCell) => {
          const isActive = orderBy === headCell.id
          return (
            <TableHead
              key={headCell.id}
              aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
              style={{
                width: headCell.width ? headCell.width : undefined,
                textAlign: headCell.align ? (headCell.align as React.CSSProperties['textAlign']) : undefined,
              }}
              className={classNames({ 'text-sm': !panel }, 'first:pl-3', { sticky: headCell.sticky })}
            >
              {headCell.disableSort ? (
                <span className={classNames({ 'text-sm': !panel })}>{headCell.label}</span>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={createSortHandler(headCell.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      createSortHandler(headCell.id)()
                    }
                  }}
                  className={classNames(
                    'inline-flex cursor-pointer items-center gap-0.5 whitespace-nowrap',
                    { 'text-sm': !panel },
                    'select-none',
                  )}
                >
                  {headCell.label}
                  {isActive ? (
                    order === 'desc' ? (
                      <ChevronDown className="size-4" aria-hidden />
                    ) : (
                      <ChevronUp className="size-4" aria-hidden />
                    )
                  ) : null}
                  {isActive ? (
                    <span className="sr-only">{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span>
                  ) : null}
                </span>
              )}
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
  )
}

export type EnhancedTableProps = {
  rows: EnhancedRow[]
  headCells: EnhancedHeadCell[]
  compact?: boolean
  footer?: ReactNode
  /** Renders in the shared panel look: grey header bar, inset hover pills, gradient row dividers. */
  panel?: boolean
}

const pageSizes = [10, 25, 100]
const pageSizeItems = Object.fromEntries(pageSizes.map((size) => [String(size), String(size)]))

/**
 * @deprecated Use `PaginatedDataTable` (features/spaces/components/PaginatedDataTable) for new
 * tables — it takes typed columns instead of untyped cell maps, and bounds width/alignment to the
 * design system. This one stays for its nine existing consumers; it is missing typed columns and
 * responsive column dropping, and `PaginatedDataTable` is missing rows-per-page pagination and a
 * footer slot, so the two converge one consumer at a time rather than in a single sweep.
 */
function EnhancedTable({ rows, headCells, compact, footer, panel }: EnhancedTableProps) {
  const [order, setOrder] = useState<SortDirection>('asc')
  const [orderBy, setOrderBy] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(pageSizes[1])

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (value: string | null) => {
    if (value == null) return
    setRowsPerPage(parseInt(value, 10))
    setPage(0)
  }

  const orderedRows = orderBy ? rows.slice().sort(getComparator(order, orderBy)) : rows
  const pagedRows = orderedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const showPagination = rows.length > pageSizes[0] || rowsPerPage !== pageSizes[1]

  const from = rows.length === 0 ? 0 : page * rowsPerPage + 1
  const to = Math.min(rows.length, page * rowsPerPage + rowsPerPage)
  const isFirstPage = page === 0
  const isLastPage = to >= rows.length

  // `panel` renders inside a surface its parent draws (TableCard), so it brings no card chrome of
  // its own — the shared module's insets are the only ones.
  return (
    <div className={classNames('w-full', { 'mb-4': !panel })}>
      <div
        data-testid="table-container"
        className={classNames('w-full overflow-x-auto md:overflow-x-hidden', {
          'rounded-t-lg bg-[var(--color-background-paper)]': !panel,
          'rounded-b-none': !panel && showPagination,
          'rounded-b-lg': !panel && !showPagination,
        })}
      >
        <Table
          aria-labelledby="tableTitle"
          variant={panel ? 'panel' : 'default'}
          className={classNames({ [css.compactTable]: compact })}
        >
          <EnhancedTableHead
            headCells={headCells}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            panel={panel}
          />
          {/* `tableBody` only clears the last row's border, which the panel look draws itself. */}
          <TableBody className={panel ? undefined : css.tableBody}>
            {pagedRows.length > 0 ? (
              pagedRows.map((row, index) => {
                const rowKey = row.key ?? index

                return (
                  <TableRow
                    data-testid="table-row"
                    tabIndex={-1}
                    key={rowKey}
                    data-state={row.selected ? 'selected' : undefined}
                  >
                    {Object.entries(row.cells).map(([key, cell]) => (
                      <TableCell key={key} data-testid={`table-cell-${key}`} className="first:pl-3">
                        <div className="overflow-hidden transition-all">{cell.content}</div>
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              // Prevent no `tbody` rows hydration error
              <TableRow>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div
          className={classNames('flex items-center justify-between border-t border-[var(--color-border-light)]', {
            'rounded-b-lg rounded-t-none bg-[var(--color-background-paper)]': !panel,
          })}
        >
          {footer && <div className="flex h-[52px] items-center px-4">{footer}</div>}
          <div data-testid="table-pagination" className="flex h-[52px] flex-1 items-center justify-end gap-4 px-4">
            <Typography variant="paragraph-small" color="muted">
              Rows per page:
            </Typography>
            <Select value={String(rowsPerPage)} onValueChange={handleChangeRowsPerPage} items={pageSizeItems}>
              <SelectTrigger aria-label="Rows per page" data-testid="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Typography variant="paragraph-small">
              {from}–{to} of {rows.length}
            </Typography>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to previous page"
                data-testid="prev-page-btn"
                disabled={isFirstPage}
                onClick={() => handleChangePage(page - 1)}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to next page"
                data-testid="next-page-btn"
                disabled={isLastPage}
                onClick={() => handleChangePage(page + 1)}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {!showPagination && footer && (
        <div
          className={classNames('flex h-[52px] items-center border-t border-[var(--color-background-main)] px-4', {
            'rounded-b-lg rounded-t-none bg-[var(--color-background-paper)]': !panel,
          })}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

export default EnhancedTable
