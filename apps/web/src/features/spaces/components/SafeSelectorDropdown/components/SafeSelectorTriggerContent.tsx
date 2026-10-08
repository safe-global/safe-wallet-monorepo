import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import CopyAddressButton from '@/components/common/AccountRow/CopyAddressButton'
import type { SafeItemData } from '@views/features/spaces/components/SafeSelectorDropdown/types'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { HypernativeFeature, useIsHypernativeGuard } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { SafeSelectorTriggerContentView } from '@views/features/spaces/components/SafeSelectorDropdown/components/SafeSelectorTriggerContentView'

export interface SafeSelectorTriggerContentProps {
  selectedItem: SafeItemData
  selectedChainId: string
}

function SafeSelectorTriggerContent({ selectedItem, selectedChainId }: SafeSelectorTriggerContentProps) {
  const selectedChain = selectedItem.chains.find((c) => c.chainId === selectedChainId) ?? selectedItem.chains[0]
  const isUndeployed = Boolean(selectedChain?.isUndeployed)
  const isActivating = Boolean(selectedChain?.isActivating)

  const resolvedName = useSafeDisplayName(selectedItem.address, selectedChainId)

  const chainConfig = useChain(selectedChain?.chainId ?? '')
  const blockExplorerLink = chainConfig ? getBlockExplorerLink(chainConfig, selectedItem.address) : undefined

  const { SafeHeaderHnTooltip } = useLoadFeature(HypernativeFeature)
  const { isHypernativeGuard } = useIsHypernativeGuard()

  return (
    <SafeSelectorTriggerContentView
      selectedItem={selectedItem}
      name={resolvedName}
      isUndeployed={isUndeployed}
      isActivating={isActivating}
      blockExplorerLink={blockExplorerLink}
      hnTooltip={isHypernativeGuard && <SafeHeaderHnTooltip />}
      copyButton={<CopyAddressButton address={selectedItem.address} />}
      envHintButton={<EnvHintButton chainId={selectedChainId} />}
    />
  )
}

export default SafeSelectorTriggerContent
