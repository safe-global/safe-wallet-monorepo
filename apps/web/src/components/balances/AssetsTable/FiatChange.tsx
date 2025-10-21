import { Chip, SvgIcon, Tooltip, Typography } from '@mui/material'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import ArrowDown from '@/public/images/balances/change-down.svg'
import ArrowUp from '@/public/images/balances/change-up.svg'

export const FiatChange = ({ change, inline = false }: { change?: number | string | null; inline?: boolean }) => {
  if (change == null) {
    return (
      <Typography variant="caption" color="text.secondary" paddingLeft={3} display="block">
        n/a
      </Typography>
    )
  }

  const changeAsNumber = Number(change) / 100
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
          '& .MuiChip-label': { pr: inline ? 0 : 1 },
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
