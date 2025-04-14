import type { ChangeEvent, ReactNode } from 'react'
import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import type { SortDirection } from '@mui/material/TableCell'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import { visuallyHidden } from '@mui/utils'
import classNames from 'classnames'

import css from './styles.module.css'
import { Collapse } from '@mui/material'

type EnhancedCell = {
  content: ReactNode
  rawValue: string | number | null
  sticky?: boolean
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
  order: 'asc' | 'desc'
  orderBy: string
}

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const { headCells, order, orderBy, onRequestSort } = props
  const createSortHandler = (property: string) => () => {
    onRequestSort(property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="left"
            padding="normal"
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              width: headCell.width ? headCell.width : '',
              textAlign: headCell.align ? headCell.align : '',
            }}
            className={classNames({ sticky: headCell.sticky })}
          >
            {headCell.label && (
              <>
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={createSortHandler(headCell.id)}
                  sx={{ mr: [0, '-26px'], textWrap: 'nowrap' }}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export type EnhancedTableProps = {
  rows: EnhancedRow[]
  headCells: EnhancedHeadCell[]
  mobileVariant?: boolean
}

const pageSizes = [10, 25, 100]

function EnhancedTable({ rows, headCells, mobileVariant }: EnhancedTableProps) {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [orderBy, setOrderBy] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(pageSizes[1])

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const orderedRows = orderBy ? rows.slice().sort(getComparator(order, orderBy)) : rows
  const pagedRows = orderedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer data-testid="table-container" component={Paper} sx={{ width: '100%', mb: 2 }}>
        <Table aria-labelledby="tableTitle" className={mobileVariant ? css.mobileColumn : undefined}>
          <EnhancedTableHead headCells={headCells} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody>
            {pagedRows.length > 0 ? (
              pagedRows.map((row, index) => (
                <TableRow
                  data-testid="table-row"
                  tabIndex={-1}
                  key={row.key ?? index}
                  selected={row.selected}
                  className={row.collapsed ? css.collapsedRow : undefined}
                >
                  {Object.entries(row.cells).map(([key, cell]) => (
                    <TableCell
                      key={key}
                      className={classNames({
                        sticky: cell.sticky,
                        [css.collapsedCell]: row.collapsed,
                      })}
                    >
                      <Collapse key={index} in={!row.collapsed} enter={false}>
                        {cell.content}
                      </Collapse>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Prevent no `tbody` rows hydration error
              <TableRow>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > pagedRows.length && (
        <TablePagination
          data-testid="table-pagination"
          rowsPerPageOptions={pageSizes}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Box>
  )
}

export default EnhancedTable
