import { Chip, SvgIcon, Tooltip, Typography } from '@mui/material'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import ArrowDown from '@/public/images/balances/change-down.svg'
import ArrowUp from '@/public/images/balances/change-up.svg'

interface FiatChangeProps {
  balanceItem?: Balance
  change?: string | null
  inline?: boolean
}

/**
 * Displays 24h fiat change percentage with directional indicator.
 * @param balanceItem - Optional balance item for backward compatibility
 * @param change - 24h price change as decimal string (e.g., "0.0431" for 4.31%). Takes precedence over balanceItem.fiatBalance24hChange
 * @param inline - Inline display variant
 */
export const FiatChange = ({ balanceItem, change, inline = false }: FiatChangeProps) => {
  const fiatChange = change ?? balanceItem?.fiatBalance24hChange ?? null

  if (!fiatChange) {
    return (
      <Typography variant="caption" color="text.secondary" paddingLeft={3} display="block">
        n/a
      </Typography>
    )
  }

  const changeAsNumber = Number(fiatChange) / 100
  const changeLabel = formatPercentage(changeAsNumber)
  const direction = changeAsNumber < 0 ? 'down' : changeAsNumber > 0 ? 'up' : 'none'

  const backgroundColor =
    direction === 'down' ? 'error.background' : direction === 'up' ? 'success.background' : 'default'
  const color = direction === 'down' ? 'error.main' : direction === 'up' ? 'success.main' : 'default'

  return (
    <Tooltip title="24h change">
      <Chip
        size="small"
        sx={{
          backgroundColor: inline ? 'transparent' : backgroundColor,
          color,
          padding: inline ? '0' : '2px 8px',
          height: inline ? '20px' : 'inherit',
          '& .MuiChip-label': { pr: inline ? 0 : 1, fontSize: '13px' },
        }}
        label={changeLabel}
        icon={
          direction === 'down' ? (
            <SvgIcon color="error" inheritViewBox component={ArrowDown} sx={{ width: '9px', height: '6px' }} />
          ) : direction === 'up' ? (
            <SvgIcon color="success" inheritViewBox component={ArrowUp} sx={{ width: '9px', height: '6px' }} />
          ) : (
            <>-</>
          )
        }
      />
    </Tooltip>
  )
}
