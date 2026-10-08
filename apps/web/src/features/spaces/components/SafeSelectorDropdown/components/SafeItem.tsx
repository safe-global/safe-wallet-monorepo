import FiatValue from '@/components/common/FiatValue'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { useAddressBookWriteScope } from '../../../hooks/useAddressBookWriteScope'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import CopyAddressButton from '@/components/common/AccountRow/CopyAddressButton'
import { SafeItemView } from '@views/features/spaces/components/SafeSelectorDropdown/components/SafeItemView'
import type { SafeItemData, SafeRenameTarget } from '@views/features/spaces/components/SafeSelectorDropdown/types'

const SafeItem = ({
  name,
  address,
  threshold,
  owners,
  chains,
  balance,
  isLoading,
  parentSafeId,
  onRename,
}: SafeItemData & { onRename?: (target: SafeRenameTarget) => void }) => {
  const isNested = Boolean(parentSafeId)
  const chainId = chains[0]?.chainId ?? ''
  const isUndeployed = Boolean(chains[0]?.isUndeployed)
  const isActivating = Boolean(chains[0]?.isActivating)
  const pending = chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)
  const awaitingConfirmation = chains.reduce((sum, chain) => sum + (chain.awaitingConfirmation ?? 0), 0)

  const chainIds = chains.map((chain) => chain.chainId)
  const resolvedName = useSafeDisplayName(address, chainId, name)
  const chainConfig = useChain(chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, address) : undefined
  const { canRename } = useAddressBookWriteScope(address, chainIds)

  return (
    <SafeItemView
      name={resolvedName}
      address={address}
      threshold={threshold}
      owners={owners}
      chains={chains}
      isLoading={isLoading}
      isNested={isNested}
      isUndeployed={isUndeployed}
      isActivating={isActivating}
      pending={pending}
      awaitingConfirmation={awaitingConfirmation}
      explorerLink={explorerLink}
      onRename={onRename && canRename ? () => onRename({ address, name: resolvedName, chainIds }) : undefined}
      copyButton={<CopyAddressButton address={address} testId="safe-item-copy-address" />}
      balance={<FiatValue value={balance} />}
    />
  )
}

export default SafeItem
