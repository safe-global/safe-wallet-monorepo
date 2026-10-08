import type { ReactNode } from 'react'
import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import SafeBalanceBlock from './SafeBalanceBlock'
import { ThresholdBadge } from '@views/components/common/AccountBadges'
import ExplorerLinkButton from '@views/components/common/AccountRow/ExplorerLinkButton'
import FullAddress from '@views/components/common/AccountRow/FullAddress'
import TruncatedText from '@views/components/common/AccountRow/TruncatedText'
import { getInitials, getSafeDisplayInfo } from '@views/components/common/AccountRow/utils'
import NotActivatedBadge from '@views/components/common/NotActivatedBadge'
import type { SafeItemData } from '@views/features/spaces/components/SafeSelectorDropdown/types'

export interface SafeSelectorTriggerContentViewProps {
  selectedItem: SafeItemData
  name: string
  isUndeployed: boolean
  isActivating: boolean
  blockExplorerLink?: { href: string; title: string }
  hnTooltip: ReactNode
  copyButton: ReactNode
  envHintButton: ReactNode
}

export function SafeSelectorTriggerContentView({
  selectedItem,
  name,
  isUndeployed,
  isActivating,
  blockExplorerLink,
  hnTooltip,
  copyButton,
  envHintButton,
}: SafeSelectorTriggerContentViewProps) {
  const { shortAddress, displayName } = getSafeDisplayInfo(name, selectedItem.address)

  return (
    <div className="flex items-center gap-2 w-full" data-testid="safe-header-info">
      <div className="relative shrink-0">
        <Avatar size="sm" data-testid="safe-icon">
          <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0" data-testid="safe-selector-trigger-details">
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <TruncatedText
            data-testid="safe-selector-trigger-name"
            variant="paragraph-small-medium"
            className="block min-w-0"
            text={displayName}
          />
          {hnTooltip}
        </div>
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <FullAddress
            address={selectedItem.address}
            className="max-sm:hidden"
            data-testid="safe-selector-trigger-address"
          />
          {/* The full address would starve the name/balance on small screens — short form instead. */}
          <Typography variant="paragraph-mini" color="muted" className="font-mono sm:hidden">
            {shortAddress}
          </Typography>
          {/* Inline after the address so hovering never paints over it — the actions reserve their
              width and the address middle-truncates when space is short. Hidden (not removed) until
              hover/focus on sm+ so the layout stays stable; always visible inline on touch. */}
          <span className="flex shrink-0 items-center gap-0.5 sm:pointer-events-none sm:opacity-0 sm:transition-opacity sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
            {copyButton}
            {blockExplorerLink && <ExplorerLinkButton href={blockExplorerLink.href} title={blockExplorerLink.title} />}
            {envHintButton}
          </span>
        </div>
      </div>
      {selectedItem.owners > 0 && (
        // flex (not inline): the inline-flex badge would otherwise sit on the wrapper's text
        // baseline and render a couple of px above the vertical middle of the chip.
        <span className="flex shrink-0 items-center max-sm:hidden">
          {/* The trigger always reflects the active safe on the active chain, so it shows that chain's
              threshold — even for a multi-chain safe (the dropdown group summary stays icon-only). */}
          <ThresholdBadge threshold={selectedItem.threshold} owners={selectedItem.owners} />
        </span>
      )}
      {isUndeployed ? (
        <NotActivatedBadge isActivating={isActivating} data-testid="safe-selector-not-activated-icon" />
      ) : (
        <SafeBalanceBlock isLoading={selectedItem.isLoading ?? false} balance={selectedItem.balance} />
      )}
    </div>
  )
}
