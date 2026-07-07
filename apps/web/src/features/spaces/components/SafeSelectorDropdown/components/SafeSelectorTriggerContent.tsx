import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { getInitials, getSafeDisplayInfo } from '../utils'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeBalanceBlock from './SafeBalanceBlock'
import { ThresholdBadge } from '@/components/common/AccountBadges'
import CopyAddressButton from './CopyAddressButton'
import ExplorerLinkButton from './ExplorerLinkButton'
import FullAddress from './FullAddress'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData } from '../types'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { HypernativeFeature, useIsHypernativeGuard } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
  /** True when the safe exists on more than one chain — the owner computes this across all items,
   * since the trigger item itself can be a chain-scoped entry for the current safe. */
  isMultiChain?: boolean
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId, isMultiChain }: SafeSelectorTriggerContentProps) {
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const isUndeployed = Boolean(selectedChain?.isUndeployed)
  const isActivating = Boolean(selectedChain?.isActivating)

  const resolvedName = useSafeDisplayName(selectedItem.address, selectedChainId)
  const { shortAddress, displayName } = getSafeDisplayInfo(resolvedName, selectedItem.address)

  const chainConfig = useChain(selectedChain?.chainId ?? '')
  const blockExplorerLink = chainConfig ? getBlockExplorerLink(chainConfig, selectedItem.address) : undefined

  const { SafeHeaderHnTooltip } = useLoadFeature(HypernativeFeature)
  const { isHypernativeGuard } = useIsHypernativeGuard()

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full">
      <div className="relative shrink-0">
        <Avatar size="sm" data-testid="safe-icon">
          <AvatarImage src={blo(selectedItem.address as `0x${string}`)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0" data-testid="safe-selector-trigger-details">
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <Typography
            data-testid="safe-selector-trigger-name"
            variant="paragraph-small-medium"
            className="block truncate min-w-0"
          >
            {displayName}
          </Typography>
          {isHypernativeGuard && <SafeHeaderHnTooltip />}
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
          <CopyAddressButton address={selectedItem.address} />
          {blockExplorerLink && <ExplorerLinkButton href={blockExplorerLink.href} title={blockExplorerLink.title} />}
          <EnvHintButton chainId={selectedChainId} />
        </div>
      </div>
      {selectedItem.owners > 0 && (
        // flex (not inline): the inline-flex badge would otherwise sit on the wrapper's text
        // baseline and render a couple of px above the vertical middle of the chip.
        <span className="flex shrink-0 items-center max-sm:hidden">
          {/* Multi-chain setups can differ per chain, so the count would be misleading — icon only. */}
          <ThresholdBadge
            threshold={selectedItem.threshold}
            owners={selectedItem.owners}
            iconOnly={isMultiChain ?? selectedItem.chains.length > 1}
          />
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

export default SafeSelectorTriggerContent
