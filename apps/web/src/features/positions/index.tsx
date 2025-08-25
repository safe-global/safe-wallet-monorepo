import { Box, Card, Stack, Typography } from '@mui/material'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import EnhancedTable from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getReadablePositionType } from '@/features/positions/utils'
import IframeIcon from '@/components/common/IframeIcon'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import usePositions from '@/features/positions/hooks/usePositions'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'

export const Positions = () => {
  const fiatTotal = usePositionsFiatTotal()
  const currentData = usePositions()

  if (!currentData || currentData.length === 0) return null

  return (
    <Stack gap={2}>
      {currentData.map((protocol) => {
        return (
          <Card key={protocol.protocol} sx={{ p: 2 }}>
            <PositionsHeader protocol={protocol} fiatTotal={fiatTotal} />

            {protocol.items.map((positionGroup) => {
              const rows = positionGroup.items.map((position) => ({
                cells: {
                  name: {
                    content: (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <IframeIcon
                          src={position.tokenInfo.logoUri || ''}
                          alt={position.tokenInfo.name + ' icon'}
                          width={32}
                          height={32}
                        />

                        <Box>
                          <Typography fontWeight="bold">{position.tokenInfo.name}</Typography>
                          <Typography variant="body2" color="primary.light">
                            {position.tokenInfo.symbol} •&nbsp; {getReadablePositionType(position.position_type)}
                          </Typography>
                        </Box>
                      </Stack>
                    ),
                    rawValue: 'Test',
                  },
                  balance: {
                    content: (
                      <Typography>
                        {formatVisualAmount(position.balance, position.tokenInfo.decimals)} {position.tokenInfo.symbol}
                      </Typography>
                    ),
                    rawValue: position.balance,
                  },
                  value: {
                    content: (
                      <Box textAlign="right">
                        <Typography>
                          <FiatValue value={position.fiatBalance} />
                        </Typography>
                        <Typography variant="caption">
                          <FiatChange balanceItem={position} inline />
                        </Typography>
                      </Box>
                    ),
                    rawValue: position.fiatBalance,
                  },
                },
              }))

              const headCells = [
                {
                  id: 'name',
                  label: (
                    <Typography variant="caption" letterSpacing="0px" fontWeight="bold" color="text.primary">
                      {positionGroup.name}
                    </Typography>
                  ),
                  disableSort: true,
                },
                { id: 'balance', label: 'Balance', disableSort: true },
                { id: 'value', label: 'Value', align: 'right', disableSort: true },
              ]

              return (
                <Box key={positionGroup.name} mt={2}>
                  <EnhancedTable rows={rows} headCells={headCells} compact />
                </Box>
              )
            })}
          </Card>
        )
      })}
    </Stack>
  )
}

export default Positions
