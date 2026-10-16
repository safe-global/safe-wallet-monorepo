import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import PeerAddress from '@/components/common/PeerAddress'
import { useCurrentChain } from '@/hooks/useChains'

/** The saved name; hovering it compares the entered address with the saved one, matching ends bolded. */
export const SimilarAddressTooltip = ({
  name,
  savedAddress,
  enteredAddress,
}: {
  name: string
  savedAddress: string
  enteredAddress: string
}): ReactElement => {
  const chain = useCurrentChain()
  const { prefixLen, suffixLen } = getCommonAffixLengths(enteredAddress, savedAddress)
  const sections = [
    ['Address entered:', enteredAddress],
    [`Saved address (${name}):`, savedAddress],
  ] as const

  return (
    <Tooltip>
      <TooltipTrigger render={<strong className="cursor-help" />}>{name}</TooltipTrigger>
      <TooltipContent className="max-w-none">
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
      </TooltipContent>
    </Tooltip>
  )
}
