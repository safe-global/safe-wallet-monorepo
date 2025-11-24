import { Box, Stack, Typography } from '@mui/material'
import EnhancedTable from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getReadablePositionType } from '@/features/positions/utils'
import IframeIcon from '@/components/common/IframeIcon'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

interface PositionGroupProps {
  /** Position group to display */
  group: Protocol['items'][0]
  /** Whether this is the last group in the list */
  isLast?: boolean
}

/**
 * Displays a position group with its positions in a table.
 */
export const PositionGroup = ({ group, isLast = false }: PositionGroupProps) => {
  const headCells = [
    {
      id: 'name',
      label: (
        <Typography variant="body2" fontWeight="bold" color="text.primary">
          {group.name}
        </Typography>
      ),
      width: '25%',
      disableSort: true,
    },
    { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
    { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
  ]

  const rows = group.items.map((position) => ({
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
              <Typography variant="body2" fontWeight="bold">
                {position.tokenInfo.name}
              </Typography>
              <Typography variant="body2" color="primary.light">
                {position.tokenInfo.symbol} •&nbsp; {getReadablePositionType(position.position_type)}
              </Typography>
            </Box>
          </Stack>
        ),
        rawValue: position.tokenInfo.name,
      },
      balance: {
        content: (
          <Typography textAlign="right">
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

  return (
    <Box sx={{ mb: isLast ? 0 : 2 }}>
      <EnhancedTable rows={rows} headCells={headCells} compact />
    </Box>
  )
}
