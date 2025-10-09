import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import IframeIcon from '@/components/common/IframeIcon'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { Box } from '@mui/system'

const PositionsHeader = ({ protocol, fiatTotal }: { protocol: Protocol; fiatTotal?: number }) => {
  const shareOfFiatTotal = fiatTotal ? formatPercentage(Number(protocol.fiatTotal) / fiatTotal) : null

  return (
    <>
      <Stack direction="row" gap={1} alignItems="center" width={1}>
        <Box sx={{ borderRadius: '50%', overflow: 'hidden', display: 'flex' }}>
          <IframeIcon
            src={protocol.protocol_metadata.icon.url || ''}
            alt={protocol.protocol_metadata.name}
            width={32}
            height={32}
          />
        </Box>

        <Typography fontWeight="bold" ml={0.5}>
          {protocol.protocol_metadata.name}
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
          <FiatValue value={protocol.fiatTotal} maxLength={20} precise />
        </Typography>
      </Stack>
    </>
  )
}

export default PositionsHeader
