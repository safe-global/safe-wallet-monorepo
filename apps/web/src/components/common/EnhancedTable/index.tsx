import type { ReactNode } from 'react'
import React, { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import classNames from 'classnames'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

type SortDirection = 'asc' | 'desc'

type EnhancedCell = {
  content: ReactNode
  rawValue: string | number | null
  sticky?: boolean
  mobileLabel?: string
}

type EnhancedRow = {
  selected?: boolean
  collapsed?: boolean
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
}

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const { headCells, order, orderBy, onRequestSort } = props
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
              className={classNames('text-sm', { sticky: headCell.sticky })}
            >
              {headCell.disableSort ? (
                <span className="text-sm">{headCell.label}</span>
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
                  className="inline-flex cursor-pointer items-center gap-0.5 whitespace-nowrap text-sm select-none"
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
  mobileVariant?: boolean
  compact?: boolean
  fixedLayout?: boolean
  footer?: ReactNode
}

const pageSizes = [10, 25, 100]

function EnhancedTable({ rows, headCells, mobileVariant, compact, fixedLayout, footer }: EnhancedTableProps) {
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

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const orderedRows = orderBy ? rows.slice().sort(getComparator(order, orderBy)) : rows
  // Clamp the page so a shrinking `rows` (e.g. a search filter) can't leave us on an out-of-range page
  // showing an empty body. Derived in render rather than via an effect so it's correct on the first paint.
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1)
  const safePage = Math.min(page, lastPage)
  const pagedRows = orderedRows.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage)
  const showPagination = rows.length > pageSizes[0] || rowsPerPage !== pageSizes[1]

  const from = rows.length === 0 ? 0 : safePage * rowsPerPage + 1
  const to = Math.min(rows.length, safePage * rowsPerPage + rowsPerPage)
  const isFirstPage = safePage === 0
  const isLastPage = to >= rows.length

  return (
    <div className="mb-4 w-full overflow-hidden rounded-3xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)]">
      <div data-testid="table-container" className="w-full overflow-x-auto md:overflow-x-hidden">
        <Table
          aria-labelledby="tableTitle"
          className={classNames({
            [css.mobileColumn]: mobileVariant,
            [css.compactTable]: compact,
            [css.fixedLayout]: fixedLayout,
          })}
        >
          <EnhancedTableHead headCells={headCells} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody className={css.tableBody}>
            {pagedRows.length > 0 ? (
              pagedRows.map((row, index) => {
                const rowKey = row.key ?? index

                return (
                  <TableRow
                    data-testid="table-row"
                    tabIndex={-1}
                    key={rowKey}
                    data-state={row.selected ? 'selected' : undefined}
                    className={row.collapsed ? css.collapsedRow : undefined}
                  >
                    {Object.entries(row.cells).map(([key, cell]) => (
                      <TableCell
                        key={key}
                        data-testid={`table-cell-${key}`}
                        className={classNames({
                          [css.collapsedCell]: row.collapsed,
                        })}
                      >
                        <div className={classNames('overflow-hidden transition-all', { 'h-0': row.collapsed })}>
                          {cell.mobileLabel ? (
                            <Typography variant="paragraph-small" color="muted" className={css.mobileLabel}>
                              {cell.mobileLabel}
                            </Typography>
                          ) : null}

                          {cell.content}
                        </div>
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
        <div className="flex items-center justify-between border-t border-[var(--color-border-light)] bg-[var(--color-background-paper)]">
          {footer && <div className="flex h-[52px] items-center px-4">{footer}</div>}
          <div data-testid="table-pagination" className="flex h-[52px] flex-1 items-center justify-end gap-4 px-4">
            <Typography variant="paragraph-small" color="muted">
              Rows per page:
            </Typography>
            <NativeSelect
              size="sm"
              aria-label="Rows per page"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="text-sm"
            >
              {pageSizes.map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Typography variant="paragraph-small">
              {from}–{to} of {rows.length}
            </Typography>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to previous page"
                disabled={isFirstPage}
                onClick={() => handleChangePage(safePage - 1)}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to next page"
                disabled={isLastPage}
                onClick={() => handleChangePage(safePage + 1)}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {!showPagination && footer && (
        <div className="flex h-[52px] items-center border-t border-[var(--color-background-main)] bg-[var(--color-background-paper)] px-4">
          {footer}
        </div>
      )}
    </div>
  )
}

export default EnhancedTable
