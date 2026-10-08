import { Eye } from 'lucide-react'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExplorerLinkButton from '@views/components/common/AccountRow/ExplorerLinkButton'
import { HOVER_ACTION_CLASS, TOOLTIP_DELAY_MS } from '@views/components/common/AccountRow/utils'
import { SafeInfoDisplayView } from '@views/components/common/AccountRow/SafeInfoDisplayView'
import { cn } from '@/utils/cn'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import SafeRowStats from './SafeRowStats'
import NotActivatedBadge from '@views/components/common/NotActivatedBadge'
import type { SafeItemData, SafeItemDataChain } from '@views/features/spaces/components/SafeSelectorDropdown/types'

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

export interface NetworkRowViewProps {
  chain: SafeItemDataChain
  address: string
  explorerLink?: { href: string; title: string }
  balance?: ReactNode
}

/**
 * One selectable network under a multi-chain safe. Carries the per-chain explorer link (the summary
 * row above spans several chains, so its explorer would be arbitrary — it lives here instead).
 */
export function NetworkRowView({ chain, address, explorerLink, balance }: NetworkRowViewProps) {
  return (
    <SelectItem
      value={`${chain.chainId}:${address}`}
      // pl-11 (avatar 32px + gap-3 12px) aligns the chain name under the parent safe name — the
      // per-chain rows carry no identicon but keep the same threshold / network / pending / balance
      // columns as the summary row. [&>span.absolute]:hidden drops the built-in checkmark span.
      className="group/row flex items-center gap-2 rounded-md px-3 py-3 cursor-pointer hover:bg-muted focus:bg-muted data-[selected]:bg-[var(--color-background-light)] [&[data-selected]:hover]:bg-[var(--color-background-light-hover)] [&[data-selected]:focus]:bg-[var(--color-background-light-hover)] [&>span.absolute]:hidden"
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
        threshold={chain.threshold ?? 0}
        owners={chain.owners ?? 0}
        chains={[chain]}
        pending={chain.isUndeployed ? 0 : (chain.queued ?? 0)}
        awaitingConfirmation={chain.isUndeployed ? 0 : (chain.awaitingConfirmation ?? 0)}
      />
      {chain.isUndeployed ? (
        <RowEndColumn>
          <NotActivatedBadge isActivating={chain.isActivating} />
        </RowEndColumn>
      ) : (
        <BalanceDisplay balance={balance} isLoading={chain.isLoading} />
      )}
    </SelectItem>
  )
}

export interface MultiChainSafeItemRowViewProps {
  item: SafeItemData
  name: string
  isSelected: boolean
  leading?: ReactNode
  hidden?: boolean
  pending: number
  awaitingConfirmation: number
  onRename?: () => void
  copyButton: ReactNode
  balance: ReactNode
  networkRows: ReactNode
}

export const MultiChainSafeItemRowView = ({
  item,
  name,
  isSelected,
  leading,
  hidden,
  pending,
  awaitingConfirmation,
  onRename,
  copyButton,
  balance,
  networkRows,
}: MultiChainSafeItemRowViewProps) => (
  // Open by default when this group holds the active chain, so the current network is revealed
  // (and highlighted) without the user expanding it — the summary row itself is never highlighted.
  <Collapsible defaultOpen={isSelected} hidden={hidden} className={cn('rounded-lg', !leading && 'my-0.5')}>
    <CollapsibleTrigger
      // Scroll anchor for the open-to-current-safe behaviour (see SafeDropdownContainer).
      data-current-safe={isSelected ? 'true' : undefined}
      className={cn(
        'group/row flex w-full items-center gap-2 rounded-lg py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
        // A leading grip takes the place of some left padding so its column lines up with single-chain rows.
        leading ? 'pl-2 pr-3' : 'px-3',
      )}
    >
      {leading}
      <SafeInfoDisplayView
        name={name}
        address={item.address}
        className="flex-1 min-w-0"
        onRename={onRename}
        copyButton={copyButton}
      />
      <SafeRowStats
        threshold={item.threshold}
        owners={item.owners}
        chains={item.chains}
        pending={pending}
        awaitingConfirmation={awaitingConfirmation}
        thresholdIconOnly
      />
      <BalanceDisplay balance={balance} isLoading={item.isLoading} />
    </CollapsibleTrigger>

    <CollapsibleContent>
      <div className="flex flex-col gap-0.5 pb-1">{networkRows}</div>
    </CollapsibleContent>
  </Collapsible>
)
