import type { ReactElement } from 'react'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import PeerAddress from '@/components/common/PeerAddress'
import PeerAddressPopover from '@/components/common/PeerAddress/PeerAddressPopover'
import { useChain, useCurrentChain } from '@/hooks/useChains'

/** The saved name; hovering or pressing it compares the entered address with the saved one, matching ends bolded. */
export const SimilarAddressTooltip = ({
  name,
  savedAddress,
  enteredAddress,
  chainId,
}: {
  name: string
  savedAddress: string
  enteredAddress: string
  /** Explorer links point at this chain; defaults to the current one. */
  chainId?: string
}): ReactElement => {
  const currentChain = useCurrentChain()
  const selectedChain = useChain(chainId ?? '')
  const chain = chainId ? selectedChain : currentChain
  const { prefixLen, suffixLen } = getCommonAffixLengths(enteredAddress, savedAddress)
  const sections = [
    ['Address entered:', enteredAddress],
    [`Saved address (${name}):`, savedAddress],
  ] as const

  return (
    <PeerAddressPopover trigger={name} triggerClassName="cursor-help font-bold">
      {sections.map(([label, address]) => (
        <div key={label} className="mb-1 last:mb-0">
          <div className="font-semibold">{label}</div>
          <PeerAddress
            address={address}
            prefixLen={prefixLen}
            suffixLen={suffixLen}
            explorerLink={chain ? getBlockExplorerLink(chain, address) : undefined}
          />
        </div>
      ))}
    </PeerAddressPopover>
  )
}
