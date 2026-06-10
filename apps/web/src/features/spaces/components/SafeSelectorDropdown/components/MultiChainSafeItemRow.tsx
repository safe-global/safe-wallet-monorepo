import { Eye } from 'lucide-react'
import FiatValue from '@/components/common/FiatValue'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeInfoDisplay from './SafeInfoDisplay'
import BalanceDisplay from './BalanceDisplay'
import ChainLogo from './ChainLogo'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData, SafeItemDataChain } from '../types'

interface MultiChainSafeItemRowProps {
  item: SafeItemData
}

function StatusBadge({ chain }: { chain: SafeItemDataChain }) {
  if (chain.isUndeployed) {
    return <NotActivatedBadge isActivating={chain.isActivating} />
  }
  if (chain.isReadOnly) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-1.5 py-px text-[11px] leading-none text-muted-foreground">
        <Eye className="size-3 shrink-0" />
        Read-only
      </span>
    )
  }
  return null
}

const MultiChainSafeItemRow = ({ item }: MultiChainSafeItemRowProps) => {
  const chainId = item.chains[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(item.address, chainId, item.name)

  return (
    <Collapsible className="my-1 rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <SafeInfoDisplay name={resolvedName} address={item.address} className="flex-1 min-w-0" />
        <div className="flex items-center bg-muted rounded-full p-0.5 shrink-0">
          {item.chains.slice(0, 3).map((chainItem, index) => (
            <span
              key={chainItem.chainId}
              className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
            >
              <ChainLogo chainId={chainItem.chainId} />
            </span>
          ))}
          {item.chains.length > 3 && (
            <span
              className="size-6 rounded-full border-2 border-card bg-muted shrink-0 inline-flex items-center justify-center text-[10px] leading-none text-muted-foreground select-none"
              style={{ marginLeft: '-8px' }}
            >
              +{item.chains.length - 3}
            </span>
          )}
        </div>
        <BalanceDisplay
          balance={<FiatValue value={item.balance} />}
          threshold={item.threshold}
          owners={item.owners}
          isLoading={item.isLoading}
          showThreshold={false}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 pb-2 pl-4 pr-2">
          {item.chains.map((chain) => {
            const hasQueued = !chain.isUndeployed && (chain.queued ?? 0) > 0
            return (
              <SelectItem
                key={`${chain.chainId}:${item.address}`}
                value={`${chain.chainId}:${item.address}`}
                // [&>span.absolute]:hidden suppresses the built-in checkmark span (see SelectItem in ui/select.tsx) — this row uses its own right-aligned StatusBadge / queued count / balance instead, and the checkmark would overlap them.
                className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer data-[state=checked]:bg-muted hover:bg-muted/30 [&>span.absolute]:hidden"
              >
                <ChainLogo chainId={chain.chainId} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Typography variant="paragraph-small-medium" className="truncate">
                    {chain.chainName}
                  </Typography>
                  <StatusBadge chain={chain} />
                </div>
                {hasQueued && (
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    {chain.queued} pending
                  </Badge>
                )}
                {chain.isLoading ? (
                  <Skeleton className="h-3 w-14 rounded" />
                ) : chain.balance !== undefined ? (
                  <Typography variant="paragraph-mini" color="muted" className="whitespace-nowrap">
                    <FiatValue value={chain.balance} />
                  </Typography>
                ) : null}
              </SelectItem>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default MultiChainSafeItemRow
