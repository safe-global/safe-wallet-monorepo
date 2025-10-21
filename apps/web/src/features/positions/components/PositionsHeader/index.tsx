import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import IframeIcon from '@/components/common/IframeIcon'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { Box } from '@mui/system'

const PositionsHeader = ({ protocol, fiatTotal }: { protocol: AppBalance; fiatTotal?: number }) => {
  const protocolValue = protocol.balanceFiat || 0
  const shareOfFiatTotal = fiatTotal ? formatPercentage(protocolValue / fiatTotal) : null

  return (
    <>
      <Stack direction="row" gap={1} alignItems="center" width={1}>
        <Box sx={{ borderRadius: '50%', overflow: 'hidden', display: 'flex' }}>
          <IframeIcon src={protocol.appInfo.logoUrl || ''} alt={protocol.appInfo.name} width={32} height={32} />
        </Box>

        <Typography fontWeight="bold" ml={0.5}>
          {protocol.appInfo.name}
        </Typography>

        {shareOfFiatTotal && (
          <Tooltip title="Based on total positions value" placement="top" arrow>
            <Chip
              variant="filled"
              size="tiny"
              label={shareOfFiatTotal}
              sx={{
                backgroundColor: 'background.lightGrey',
                color: 'text.primary',
                borderRadius: 'var(--15-x, 6px)',
                '& .MuiChip-label': {
                  letterSpacing: '1px',
                },
              }}
            />
          </Tooltip>
        )}

        <Typography fontWeight="bold" mr={1} ml="auto" justifySelf="flex-end">
          <FiatValue value={protocolValue.toString()} maxLength={20} precise />
        </Typography>
      </Stack>
    </>
  )
}

export default PositionsHeader
