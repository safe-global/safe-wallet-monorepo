import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { getInitials, getSafeDisplayInfo } from '../utils'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeBalanceBlock from './SafeBalanceBlock'
import { ThresholdBadge } from '@/components/common/AccountBadges'
import CopyAddressButton from './CopyAddressButton'
import ExplorerLinkButton from './ExplorerLinkButton'
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
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId }: SafeSelectorTriggerContentProps) {
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
        <div className="flex items-center gap-1 min-w-0">
          <Typography data-testid="safe-selector-trigger-name" variant="paragraph-small-medium" className="truncate">
            {displayName}
          </Typography>
          {isHypernativeGuard && <SafeHeaderHnTooltip />}
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <Typography data-testid="safe-selector-trigger-address" variant="paragraph-mini" color="muted">
            {shortAddress}
          </Typography>
          <CopyAddressButton address={selectedItem.address} />
          {blockExplorerLink && <ExplorerLinkButton href={blockExplorerLink.href} title={blockExplorerLink.title} />}
          <EnvHintButton chainId={selectedChainId} />
        </div>
      </div>
      {selectedItem.owners > 0 && (
        <span className="shrink-0 max-sm:hidden">
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

export default SafeSelectorTriggerContent
