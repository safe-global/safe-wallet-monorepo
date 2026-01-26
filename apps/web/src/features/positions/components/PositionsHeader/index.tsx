import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { calculateProtocolPercentage } from '@safe-global/utils/features/positions'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const PositionsHeader = ({ protocol, fiatTotal }: { protocol: Protocol; fiatTotal?: number }) => {
  const shareOfFiatTotal = fiatTotal
    ? formatPercentage(calculateProtocolPercentage(protocol.fiatTotal, fiatTotal))
    : null

  return (
    <>
      <Stack direction="row" gap={1} alignItems="center" width={1}>
        <TokenIcon
          logoUri={protocol.protocol_metadata.icon.url ?? undefined}
          tokenSymbol={protocol.protocol_metadata.name}
          size={32}
        />

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
