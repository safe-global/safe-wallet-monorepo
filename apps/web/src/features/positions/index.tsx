import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Stack, Typography } from '@mui/material'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import EnhancedTable from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import IframeIcon from '@/components/common/IframeIcon'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React from 'react'
import PositionsUnavailable from './components/PositionsUnavailable'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import PositionsSkeleton from '@/features/positions/components/PositionsSkeleton'
import usePortfolio from '@/hooks/usePortfolio'
import PositionsEmpty from '@/features/positions/components/PositionsEmpty'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'

export const Positions = () => {
  const { positionBalances, totalPositionsBalance, isLoading, error } = usePortfolio()
  const protocols = positionBalances

  if (isLoading || (!error && !protocols)) {
    return <PositionsSkeleton />
  }

  if (error || !protocols) return <PositionsUnavailable hasError={!!error} />

  if (protocols.length === 0) {
    return <PositionsEmpty entryPoint="Positions" />
  }

  return (
    <Stack gap={2}>
      <Box>
        <Box mb={2}>
          <TotalAssetValue fiatTotal={totalPositionsBalance} title="Total positions value" />
        </Box>

        <Typography variant="h4" fontWeight={700}>
          Positions
        </Typography>

        <Box mb={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Position balances are not included in the total asset value.
          </Typography>
        </Box>
      </Box>

      {protocols.map((protocol) => {
        const rows = protocol.positions.map((position) => {
          return {
            cells: {
              name: {
                content: (
                  <Stack direction="row" alignItems="center" gap={1}>
                    <IframeIcon
                      src={position.tokenInfo.logoUrl || ''}
                      alt={position.tokenInfo.name + ' icon'}
                      width={32}
                      height={32}
                    />

                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {position.name}
                      </Typography>
                      <Typography variant="body2" color="primary.light">
                        {position.tokenInfo.symbol} •&nbsp; {position.type}
                      </Typography>
                    </Box>
                  </Stack>
                ),
                rawValue: position.name,
              },
              balance: {
                content: (
                  <Typography textAlign="right">
                    {formatAmount(position.balance)} {position.tokenInfo.symbol}
                  </Typography>
                ),
                rawValue: position.balance,
              },
              value: {
                content: (
                  <Box textAlign="right">
                    <Typography>
                      <FiatValue value={position.balanceFiat?.toString() || '0'} />
                    </Typography>
                    <Typography variant="caption">
                      <FiatChange change={position.priceChangePercentage1d} inline />
                    </Typography>
                  </Box>
                ),
                rawValue: position.balanceFiat?.toString() || '0',
              },
            },
          }
        })

        const headCells = [
          {
            id: 'name',
            label: (
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Positions
              </Typography>
            ),
            width: '25%',
            disableSort: true,
          },
          { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
          { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
        ]

        return (
          <Card key={protocol.appInfo.name} sx={{ border: 0 }}>
            <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{ justifyContent: 'center', overflowX: 'auto', backgroundColor: 'transparent !important' }}
              >
                <PositionsHeader protocol={protocol} fiatTotal={parseFloat(totalPositionsBalance || '0')} />
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 0 }}>
                <EnhancedTable rows={rows} headCells={headCells} compact />
              </AccordionDetails>
            </Accordion>
          </Card>
        )
      })}
    </Stack>
  )
}

export default Positions
