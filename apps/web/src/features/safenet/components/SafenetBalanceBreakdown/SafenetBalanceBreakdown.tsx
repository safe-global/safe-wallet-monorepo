import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import type { SafenetBalance } from '@/utils/safenet'
import { Box, Table, TableCell, TableRow, Typography } from '@mui/material'
import css from './styles.module.css'

const SafenetBalanceBreakdown = ({ asset }: { asset: SafenetBalance[] }) => (
  <Box className={css.balanceBreakdown}>
    <Box className={css.title}>
      <Typography variant="body2" fontWeight={700} fontSize={11} color="text.secondary">
        NETWORK
      </Typography>
    </Box>
    <Table sx={{ borderTop: '1px solid var(--color-border-light)' }}>
      {asset
        .filter((breakdown) => parseFloat(breakdown.balance) > 0)
        .map((breakdown) => {
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

export default SafenetBalanceBreakdown
