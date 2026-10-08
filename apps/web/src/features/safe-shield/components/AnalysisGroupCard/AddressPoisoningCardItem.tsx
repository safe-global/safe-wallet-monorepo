import { Severity, type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import CopyTooltip from '@/components/common/CopyTooltip'
import { SEVERITY_COLORS } from '../../constants'
import { AddressPoisoningCardItemView } from '@views/features/safe-shield/components/AnalysisGroupCard/AddressPoisoningCardItemView'

interface AddressPoisoningCardItemProps {
  result: AnalysisResult
}

/** Entered address vs the trusted address it resembles, matching ends bolded. */
export const AddressPoisoningCardItem = ({ result }: AddressPoisoningCardItemProps) => {
  const chain = useCurrentChain()
  const [entered, anchor] = result.addresses ?? []
  const { prefixLen, suffixLen } =
    entered && anchor ? getCommonAffixLengths(entered.address, anchor.address) : { prefixLen: 0, suffixLen: 0 }
  const borderColor = SEVERITY_COLORS[result.severity]?.main ?? SEVERITY_COLORS[Severity.CRITICAL].main
  const explorerHref = (address: string) => (chain ? getBlockExplorerLink(chain, address)?.href : undefined)

  return (
    <AddressPoisoningCardItemView
      description={result.description}
      borderColor={borderColor}
      entered={entered && { address: entered.address, explorerHref: explorerHref(entered.address) }}
      anchor={anchor && { address: anchor.address, name: anchor.name, explorerHref: explorerHref(anchor.address) }}
      prefixLen={prefixLen}
      suffixLen={suffixLen}
      renderCopyTooltip={(props) => <CopyTooltip {...props} />}
    />
  )
}
