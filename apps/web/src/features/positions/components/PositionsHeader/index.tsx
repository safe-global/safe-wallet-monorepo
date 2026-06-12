import TokenIcon from '@/components/common/TokenIcon'
import FiatValue from '@/components/common/FiatValue'
import { Chip } from '@/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { calculateProtocolPercentage } from '@safe-global/utils/features/positions'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const PositionsHeader = ({ protocol, fiatTotal }: { protocol: Protocol; fiatTotal?: number }) => {
  const shareOfFiatTotal = fiatTotal
    ? formatPercentage(calculateProtocolPercentage(protocol.fiatTotal, fiatTotal))
    : null

  return (
    <div className="flex w-full items-center gap-2">
      <TokenIcon
        logoUri={protocol.protocol_metadata.icon.url ?? undefined}
        tokenSymbol={protocol.protocol_metadata.name}
        size={32}
      />

      <Typography variant="paragraph-bold" className="ml-1">
        {protocol.protocol_metadata.name}
      </Typography>

      {shareOfFiatTotal && (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Chip className="rounded-md bg-[var(--color-background-secondary)] text-[var(--color-text-primary)]">
              {shareOfFiatTotal}
            </Chip>
          </TooltipTrigger>
          <TooltipContent>Based on total positions value</TooltipContent>
        </Tooltip>
      )}

      <Typography variant="paragraph-bold" className="mr-2 ml-auto justify-self-end">
        <FiatValue value={protocol.fiatTotal} maxLength={20} precise />
      </Typography>
    </div>
  )
}

export default PositionsHeader
