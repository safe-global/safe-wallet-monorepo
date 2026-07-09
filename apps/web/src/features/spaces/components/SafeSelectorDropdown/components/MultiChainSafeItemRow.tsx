import { Eye } from 'lucide-react'
import FiatValue from '@/components/common/FiatValue'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SelectItem } from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { SafeInfoDisplay } from '@/components/common/AccountRow'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import SafeRowStats from './SafeRowStats'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData, SafeRenameTarget } from '../types'

interface MultiChainSafeItemRowProps {
  item: SafeItemData
  onRename?: (target: SafeRenameTarget) => void
  /**
   * True when this multi-chain group holds the currently-active chain. The group then expands by
   * default and only the active network row is highlighted — the summary row itself stays unhighlighted
   * (the highlight belongs to the specific network, not the whole multi-chain safe).
   */
  isSelected?: boolean
}

function ReadOnlyBadge() {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-px text-[11px] leading-none text-muted-foreground">
      <Eye className="size-3 shrink-0" />
      Read-only
    </span>
  )
}

const MultiChainSafeItemRow = ({ item, onRename, isSelected = false }: MultiChainSafeItemRowProps) => {
  const chainId = item.chains[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(item.address, chainId, item.name)
  const pending = item.chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)
  const chainConfig = useChain(chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, item.address) : undefined

  return (
    // Open by default when this group holds the active chain, so the current network is revealed
    // (and highlighted) without the user expanding it — the summary row itself is never highlighted.
    <Collapsible defaultOpen={isSelected} className="my-0.5 rounded-lg">
      <CollapsibleTrigger
        // Scroll anchor for the open-to-current-safe behaviour (see SafeDropdownContainer).
        data-current-safe={isSelected ? 'true' : undefined}
        className="group/row flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
        <div className="flex flex-col gap-0.5 pb-1">
          {item.chains.map((chain) => (
            <SelectItem
              key={`${chain.chainId}:${item.address}`}
              value={`${chain.chainId}:${item.address}`}
              // pl-11 (avatar 32px + gap-3 12px) aligns the chain name under the parent safe name — the
              // per-chain rows carry no identicon but keep the same threshold / network / pending / balance
              // columns as the summary row. [&>span.absolute]:hidden drops the built-in checkmark span.
              className="flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer focus:bg-muted data-[selected]:bg-muted [&>span.absolute]:hidden"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 pl-11">
                <Typography variant="paragraph-small-medium" className="min-w-0 truncate">
                  {chain.chainName}
                </Typography>
                {chain.isReadOnly && <ReadOnlyBadge />}
              </div>
              <SafeRowStats
                threshold={item.threshold}
                owners={item.owners}
                chains={[chain]}
                pending={chain.isUndeployed ? 0 : (chain.queued ?? 0)}
              />
              {chain.isUndeployed ? (
                <RowEndColumn>
                  <NotActivatedBadge isActivating={chain.isActivating} />
                </RowEndColumn>
              ) : (
                <BalanceDisplay
                  balance={chain.balance !== undefined ? <FiatValue value={chain.balance} /> : undefined}
                  isLoading={chain.isLoading}
                />
              )}
            </SelectItem>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default MultiChainSafeItemRow
