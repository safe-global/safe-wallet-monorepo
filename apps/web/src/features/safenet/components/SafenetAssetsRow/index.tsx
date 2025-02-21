import ChainIndicator from '@/components/common/ChainIndicator'
import type { EnhancedRow } from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import { Box, Collapse, Table, TableCell, TableRow, Typography } from '@mui/material'
import classNames from 'classnames'
import { useState } from 'react'
import css from './styles.module.css'

const SafenetBalanceBreakdown = ({ row }: { row: EnhancedRow }) => (
  <Box className={css.balanceBreakdown}>
    <Box className={css.title}>
      <Typography variant="body2" fontWeight={700} fontSize={11} color="text.secondary">
        NETWORK
      </Typography>
    </Box>
    <Table sx={{ borderTop: '1px solid var(--color-border-light)' }}>
      {row.safenetBalance &&
        row.safenetBalance.map((breakdown) => {
          return (
            <TableRow className={css.row} key={breakdown.chainId}>
              <TableCell sx={{ width: '50%' }}>
                <Box sx={{ p: '4px 0px' }}>
                  <ChainIndicator chainId={breakdown.chainId} />
                </Box>
              </TableCell>
              <TableCell sx={{ width: '20%' }}>
                <TokenAmount value={breakdown.balance} decimals={breakdown.decimals} tokenSymbol={breakdown.symbol} />
              </TableCell>
              <TableCell sx={{ width: '20%', textAlign: 'right' }}>
                <FiatValue value={breakdown.fiatBalance} />
              </TableCell>
              <TableCell>
                <Box sx={{ width: '280px' }}></Box>
              </TableCell>
            </TableRow>
          )
        })}
    </Table>
  </Box>
)

const SafenetAssetsRow = ({ row, index, numRows }: { row: EnhancedRow; index: number; numRows: number }) => {
  const [open, setOpen] = useState(false)

  const isLastToken = index > 0 && index === numRows - 1

  return (
    <>
      <TableRow
        data-testid="table-row"
        tabIndex={-1}
        selected={row.selected}
        className={row.collapsed ? css.collapsedRow : undefined}
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          borderBottom:
            !isLastToken || (isLastToken && open) ? '1px solid var(--color-border-light)' : 'none !important',
        }}
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
      <TableRow style={{ borderBottom: open && !isLastToken ? '1px solid var(--color-border-light)' : 'none' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open}>
            <SafenetBalanceBreakdown row={row} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default SafenetAssetsRow
