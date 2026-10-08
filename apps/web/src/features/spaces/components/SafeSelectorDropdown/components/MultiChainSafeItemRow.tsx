import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { useAddressBookWriteScope } from '../../../hooks/useAddressBookWriteScope'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import CopyAddressButton from '@/components/common/AccountRow/CopyAddressButton'
import {
  MultiChainSafeItemRowView,
  NetworkRowView,
} from '@views/features/spaces/components/SafeSelectorDropdown/components/MultiChainSafeItemRowView'
import type {
  SafeItemData,
  SafeItemDataChain,
  SafeRenameTarget,
} from '@views/features/spaces/components/SafeSelectorDropdown/types'

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
  /** Hides the group (a search non-match) while keeping its network SelectItems mounted. */
  hidden?: boolean
}

function NetworkRow({ chain, address }: { chain: SafeItemDataChain; address: string }) {
  const chainConfig = useChain(chain.chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, address) : undefined

  return (
    <NetworkRowView
      chain={chain}
      address={address}
      explorerLink={explorerLink}
      balance={chain.balance !== undefined ? <FiatValue value={chain.balance} /> : undefined}
    />
  )
}

const MultiChainSafeItemRow = ({ item, onRename, isSelected = false, leading, hidden }: MultiChainSafeItemRowProps) => {
  const chainId = item.chains[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(item.address, chainId, item.name)
  const chainIds = item.chains.map((chain) => chain.chainId)
  const { canRename } = useAddressBookWriteScope(item.address, chainIds)
  const pending = item.chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)
  const awaitingConfirmation = item.chains.reduce((sum, chain) => sum + (chain.awaitingConfirmation ?? 0), 0)

  return (
    <MultiChainSafeItemRowView
      item={item}
      name={resolvedName}
      isSelected={isSelected}
      leading={leading}
      hidden={hidden}
      pending={pending}
      awaitingConfirmation={awaitingConfirmation}
      onRename={
        onRename && canRename ? () => onRename({ address: item.address, name: resolvedName, chainIds }) : undefined
      }
      copyButton={<CopyAddressButton address={item.address} testId="safe-item-copy-address" />}
      balance={<FiatValue value={item.balance} />}
      networkRows={item.chains.map((chain) => (
        <NetworkRow key={`${chain.chainId}:${item.address}`} chain={chain} address={item.address} />
      ))}
    />
  )
}

export default MultiChainSafeItemRow
