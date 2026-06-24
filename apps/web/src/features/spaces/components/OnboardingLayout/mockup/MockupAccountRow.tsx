import Identicon from '@/components/common/Identicon'
import { Skeleton } from '@/components/ui/skeleton'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeAppMockupAccount } from './types'

const rowFiatFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})
const formatRowFiat = (n: number): string => '$' + rowFiatFormatter.format(n)

// Multi-chain Safes appear as N overviews (one per chain); summing by address aggregates them.
export const sumOverviewsForAddress = (overviews: SafeOverview[] | undefined, address: string): number | null => {
  if (!overviews) return null
  let found = false
  let total = 0
  for (const o of overviews) {
    if (sameAddress(o.address.value, address)) {
      found = true
      total += Number(o.fiatTotal)
    }
  }
  return found ? total : null
}

interface MockupAccountRowProps {
  account: SafeAppMockupAccount
  fiatValue: number | null
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

const MockupAccountRow = ({ account, fiatValue }: MockupAccountRowProps) => {
  const displayFiat = fiatValue !== null ? formatRowFiat(fiatValue) : undefined
  const primaryText = account.name?.trim() || shortenAddress(account.address)

  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
      <div className="shrink-0 overflow-hidden rounded-full">
        <Identicon address={account.address} size={32} />
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="truncate text-sm leading-tight font-semibold text-foreground">{primaryText}</div>
        <div className="truncate text-xs leading-none text-muted-foreground tabular-nums">
          {shortenAddress(account.address)}
        </div>
      </div>

      <div className="shrink-0 text-sm leading-tight font-medium tabular-nums text-foreground">
        {displayFiat !== undefined ? displayFiat : <Skeleton className="h-3 w-12" />}
      </div>
    </div>
  )
}

export default MockupAccountRow
