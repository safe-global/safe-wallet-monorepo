import EnhancedTable from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getReadablePositionType } from '@/features/positions/utils'
import TokenIcon from '@/components/common/TokenIcon'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

interface PositionGroupProps {
  /** Position group to display */
  group: Protocol['items'][0]
  /** Whether this is the last group in the list */
  isLast?: boolean
  /** Protocol icon URL to show as badge on token icons */
  protocolIconUrl?: string | null
}

/**
 * Displays a position group with its positions in a table.
 */
export const PositionGroup = ({ group, isLast = false, protocolIconUrl }: PositionGroupProps) => {
  const headCells = [
    {
      id: 'name',
      label: (
        <Typography variant="paragraph-small-bold" className="text-[var(--color-text-primary)]">
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
    key: `${position.tokenInfo.address}-${position.position_type}`,
    cells: {
      name: {
        content: (
          <div className="flex items-center gap-2">
            <TokenIcon
              logoUri={position.tokenInfo.logoUri ?? undefined}
              tokenSymbol={position.tokenInfo.symbol}
              size={32}
              badgeUri={protocolIconUrl}
            />

            <div>
              <Typography variant="paragraph-small-bold">{position.tokenInfo.name}</Typography>
              <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
                {position.tokenInfo.symbol} •&nbsp; {getReadablePositionType(position.position_type)}
              </Typography>
            </div>
          </div>
        ),
        rawValue: position.tokenInfo.name,
      },
      balance: {
        content: (
          <Typography align="right">
            {formatVisualAmount(position.balance, position.tokenInfo.decimals)} {position.tokenInfo.symbol}
          </Typography>
        ),
        rawValue: position.balance,
      },
      value: {
        content: (
          <div className="text-right">
            <Typography>
              <FiatValue value={position.fiatBalance} />
            </Typography>
            <Typography variant="paragraph-mini" className="block">
              <FiatChange balanceItem={position} inline />
            </Typography>
          </div>
        ),
        rawValue: position.fiatBalance,
      },
    },
  }))

  return (
    <div className={cn(isLast ? 'mb-0' : 'mb-4')}>
      <EnhancedTable rows={rows} headCells={headCells} compact />
    </div>
  )
}
