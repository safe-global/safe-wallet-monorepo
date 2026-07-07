import { Eye } from 'lucide-react'
import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import SafeInfoDisplay from './SafeInfoDisplay'
import BalanceDisplay from './BalanceDisplay'
import ChainLogo from './ChainLogo'
import SafeRowStats from './SafeRowStats'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData, SafeItemDataChain, SafeRenameTarget } from '../types'

interface MultiChainSafeItemRowProps {
  item: SafeItemData
  onRename?: (target: SafeRenameTarget) => void
  /** True when this is the currently-open safe — highlighted like a checked SelectItem. */
  isSelected?: boolean
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

const MultiChainSafeItemRow = ({ item, onRename, isSelected = false }: MultiChainSafeItemRowProps) => {
  const chainId = item.chains[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(item.address, chainId, item.name)
  const pending = item.chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)
  const chainConfig = useChain(chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, item.address) : undefined

  return (
    <Collapsible className="my-0.5 rounded-lg">
      <CollapsibleTrigger
        className={cn(
          'group/row flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
          isSelected && 'bg-muted',
        )}
      >
        <SafeInfoDisplay
          name={resolvedName}
          address={item.address}
          className="flex-1 min-w-0"
          explorerLink={explorerLink}
          onRename={
            onRename &&
            (() =>
              onRename({
                address: item.address,
                name: resolvedName,
                chainIds: item.chains.map((chain) => chain.chainId),
              }))
          }
        />
        <SafeRowStats
          threshold={item.threshold}
          owners={item.owners}
          chains={item.chains}
          pending={pending}
          thresholdIconOnly
        />
        <BalanceDisplay balance={<FiatValue value={item.balance} />} isLoading={item.isLoading} />
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
                <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
                  {chain.chainName}
                </Typography>
                <StatusBadge chain={chain} />
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
