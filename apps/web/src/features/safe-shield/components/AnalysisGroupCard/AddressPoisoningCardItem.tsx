import { Severity, type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import { Typography } from '@/components/ui/typography'
import { SEVERITY_COLORS } from '../../constants'
import { HighlightedAddress } from '../HighlightedAddress'

interface AddressRowProps {
  label: string
  address: string
  prefixLen: number
  suffixLen: number
  explorerHref?: string
}

const AddressRow = ({ label, address, prefixLen, suffixLen, explorerHref }: AddressRowProps) => (
  <div className="rounded bg-[var(--color-background-paper)] p-2">
    <div className="flex flex-col gap-0.5">
      <Typography variant="paragraph-mini" className="text-muted-foreground">
        {label}
      </Typography>
      <div className="flex flex-row items-start gap-0.5">
        <CopyTooltip text={address} initialToolTipText="Copy address">
          <Typography variant="paragraph-mini" className="flex-1 cursor-pointer text-primary hover:text-foreground">
            <HighlightedAddress address={address} prefixLen={prefixLen} suffixLen={suffixLen} />
          </Typography>
        </CopyTooltip>
        {explorerHref && (
          <span className="text-muted-foreground">
            <ExplorerButton href={explorerHref} />
          </span>
        )}
      </div>
    </div>
  </div>
)

interface AddressPoisoningCardItemProps {
  result: AnalysisResult
}

/**
 * Renders the ADDRESS_POISONING group: entered address vs the trusted address it resembles, matching
 * ends bolded. Scoped to poisoning results — other Copilot cards are unaffected.
 */
export const AddressPoisoningCardItem = ({ result }: AddressPoisoningCardItemProps) => {
  const chain = useCurrentChain()
  const [entered, anchor] = result.addresses ?? []
  const { prefixLen, suffixLen } =
    entered && anchor ? getCommonAffixLengths(entered.address, anchor.address) : { prefixLen: 0, suffixLen: 0 }
  const borderColor = SEVERITY_COLORS[result.severity]?.main ?? SEVERITY_COLORS[Severity.CRITICAL].main
  const explorerHref = (address: string) => (chain ? getBlockExplorerLink(chain, address)?.href : undefined)

  return (
    <div className="overflow-hidden rounded bg-[var(--color-background-main)]">
      <div className="border-l-4 p-3" style={{ borderLeftColor: borderColor }}>
        <div className="flex flex-col gap-4">
          <Typography variant="paragraph-small" className="break-words text-primary">
            {result.description}
          </Typography>

          <div className="flex flex-col gap-2">
            {entered && (
              <AddressRow
                label="Address entered"
                address={entered.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={explorerHref(entered.address)}
              />
            )}
            {anchor && (
              <AddressRow
                label={anchor.name ? `Saved address: ${anchor.name}` : 'Saved address'}
                address={anchor.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={explorerHref(anchor.address)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
