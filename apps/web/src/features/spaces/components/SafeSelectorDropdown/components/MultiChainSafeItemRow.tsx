import { Eye } from 'lucide-react'
import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import {
  ExplorerLinkButton,
  HOVER_ACTION_CLASS,
  SafeInfoDisplay,
  TOOLTIP_DELAY_MS,
} from '@/components/common/AccountRow'
import { cn } from '@/utils/cn'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import SafeRowStats from './SafeRowStats'
import { focusRowOnHover } from './focusRowOnHover'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData, SafeItemDataChain, SafeRenameTarget } from '../types'

interface MultiChainSafeItemRowProps {
  item: SafeItemData
  onRename?: (target: SafeRenameTarget) => void
  /**
   * True when this multi-chain group holds the currently-active chain. The group then expands by
   * default and only the active network row is highlighted — the summary row itself stays unhighlighted
   * (the highlight belongs to the specific network, not the whole multi-chain safe).
   */
  isSelected?: boolean
  /**
   * Element rendered at the start of the summary row — used in Manual sort to host the drag grip so
   * dragging reorders the whole group while clicking the summary still expands it. When set, the row's
   * outer margin is dropped so the reorderable wrapper controls spacing.
   */
  leading?: ReactNode
}

// Icon-only read-only indicator. The full "Read-only" text widened the row and pushed the explorer
// link / stat columns off to the right, so the label moves into a hover tooltip instead.
function ReadOnlyBadge() {
  return (
    <Tooltip delay={TOOLTIP_DELAY_MS}>
      {/* A span trigger (not the default button) so it can nest inside the row's select item without
          producing invalid nested-button markup. */}
      <TooltipTrigger
        render={<span className="inline-flex shrink-0 items-center text-muted-foreground" />}
        aria-label="Read-only safe"
      >
        <Eye className="size-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent>Read-only safe</TooltipContent>
    </Tooltip>
  )
}

/**
 * One selectable network under a multi-chain safe. Carries the per-chain explorer link (the summary
 * row above spans several chains, so its explorer would be arbitrary — it lives here instead).
 */
function NetworkRow({
  chain,
  address,
  threshold,
  owners,
}: {
  chain: SafeItemDataChain
  address: string
  threshold: number
  owners: number
}) {
  const chainConfig = useChain(chain.chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, address) : undefined

  return (
    <SelectItem
      value={`${chain.chainId}:${address}`}
      // pl-11 (avatar 32px + gap-3 12px) aligns the chain name under the parent safe name — the
      // per-chain rows carry no identicon but keep the same threshold / network / pending / balance
      // columns as the summary row. [&>span.absolute]:hidden drops the built-in checkmark span.
      className="group/row flex items-center gap-2 rounded-md px-3 py-3 cursor-pointer focus:bg-muted data-[selected]:bg-[var(--color-background-light)] [&>span.absolute]:hidden"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-11">
        <Typography variant="paragraph-small-medium" className="min-w-0 truncate">
          {chain.chainName}
        </Typography>
        {chain.isReadOnly && <ReadOnlyBadge />}
        {explorerLink && (
          <span className={HOVER_ACTION_CLASS}>
            <ExplorerLinkButton
              href={explorerLink.href}
              title={explorerLink.title}
              testId="safe-item-row-explorer-link"
            />
          </span>
        )}
      </div>
      <SafeRowStats
        threshold={threshold}
        owners={owners}
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
  )
}

const MultiChainSafeItemRow = ({ item, onRename, isSelected = false, leading }: MultiChainSafeItemRowProps) => {
  const chainId = item.chains[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(item.address, chainId, item.name)
  const pending = item.chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)

  return (
    // Open by default when this group holds the active chain, so the current network is revealed
    // (and highlighted) without the user expanding it — the summary row itself is never highlighted.
    <Collapsible defaultOpen={isSelected} className={cn('rounded-lg', !leading && 'my-0.5')}>
      <CollapsibleTrigger
        // Scroll anchor for the open-to-current-safe behaviour (see SafeDropdownContainer).
        data-current-safe={isSelected ? 'true' : undefined}
        // Take focus on hover so base-ui's stale grey highlight leaves the previous network row.
        onMouseEnter={focusRowOnHover}
        className={cn(
          'group/row flex w-full items-center gap-2 rounded-lg py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
          // A leading grip takes the place of some left padding so its column lines up with single-chain rows.
          leading ? 'pl-2 pr-3' : 'px-3',
        )}
      >
        {leading}
        <SafeInfoDisplay
          name={resolvedName}
          address={item.address}
          className="flex-1 min-w-0"
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
            <NetworkRow
              key={`${chain.chainId}:${item.address}`}
              chain={chain}
              address={item.address}
              threshold={item.threshold}
              owners={item.owners}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default MultiChainSafeItemRow
