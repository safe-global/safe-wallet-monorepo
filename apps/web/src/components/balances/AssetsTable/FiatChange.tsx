import { Chip } from '@/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
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
      <Typography variant="paragraph-mini" color="muted" className="block pl-6">
        n/a
      </Typography>
    )
  }

  const changeAsNumber = Number(fiatChange) / 100
  const changeLabel = formatPercentage(changeAsNumber)
  const direction = changeAsNumber < 0 ? 'down' : changeAsNumber > 0 ? 'up' : 'none'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Chip
            variant={direction === 'up' ? 'positive' : direction === 'down' ? 'negative' : 'default'}
            size={inline ? 'default' : 'auto'}
            // eslint-disable-next-line no-restricted-syntax -- inline table-cell variant is not a pill: transparent background and no padding (pre-migration parity), colored text/arrow only
            className={inline ? 'bg-transparent px-0 pr-0 dark:bg-transparent' : 'pr-1'}
          >
            {direction === 'down' ? (
              <ArrowDown className="h-[6px] w-[9px] text-[var(--color-error-main)]" />
            ) : direction === 'up' ? (
              <ArrowUp className="h-[6px] w-[9px] text-[var(--color-success-main)]" />
            ) : (
              '-'
            )}
            <span className="text-[13px]">{changeLabel}</span>
          </Chip>
        }
      />
      <TooltipContent>24h change</TooltipContent>
    </Tooltip>
  )
}
