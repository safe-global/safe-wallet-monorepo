import type { QueuePartyActions } from '@safe-global/views/features/spaces/components/SpaceQueue/QueuePartyCard'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { COPIED_TOOLTIP_MS } from '@/components/common/AuditLog'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { useChain } from '@/hooks/useChains'
import { useAddToAddressBook } from './AddToAddressBook'

/** "etherscan.io" → "Etherscan": the chain config has the explorer's URL, not its name */
export const getExplorerName = (href: string): string => {
  const [label] = new URL(href).hostname.replace(/^www\./, '').split('.')
  return label ? label[0].toUpperCase() + label.slice(1) : 'Explorer'
}

/** The party card's actions for an address on a chain. Only an unnamed address can be added to the address book. */
export const useQueuePartyActions = (address: string, chainId: string, named: boolean): QueuePartyActions => {
  const { copied, copy } = useCopyToClipboard(COPIED_TOOLTIP_MS)
  const chain = useChain(chainId)
  const link = chain ? getBlockExplorerLink(chain, address) : undefined
  const addToAddressBook = useAddToAddressBook(address, chainId)

  return {
    copied,
    onCopy: () => copy(address),
    explorer: link ? { href: link.href, label: getExplorerName(link.href) } : undefined,
    onAddToAddressBook: named ? undefined : addToAddressBook,
  }
}
