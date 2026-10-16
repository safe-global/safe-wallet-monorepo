import type { ReactElement } from 'react'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Typography } from '@safe-global/views/components/ui/typography'
import { TriangleAlert, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import PeerAddress from '@/components/common/PeerAddress'
import { useChain } from '@/hooks/useChains'
import type { SimilarWarning } from '@/features/address-poisoning'

/** Inline ⚠️ after a name, listing cross-list look-alike peers in its tooltip (same-list = band only). */
export const SimilarityWarningIcon = ({
  address,
  warning,
  explorerChainId,
}: {
  /** The row's own address — each peer bolds the ends it shares with it. */
  address: string
  warning: SimilarWarning
  /** Links peers to this chain's explorer; omit for multi-chain rows. */
  explorerChainId?: string
}) => {
  const chain = useChain(explorerChainId ?? '')
  const sections = (
    [
      ['Similar accounts from trusted safes:', warning.trusted],
      ['Similar accounts from owned safes:', warning.owned],
    ] as const
  ).filter(([, peers]) => peers.length > 0)

  return (
    // Swallow the click — the icon sits inside a selectable/navigable row.
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <TriangleAlert
            size={14}
            className="shrink-0 text-yellow-800 dark:text-[var(--color-warning-main)]"
            aria-label="Possible address poisoning"
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-none">
          {sections.map(([label, peers]) => (
            <div key={label} className="mb-1 last:mb-0">
              <div className="font-semibold">{label}</div>
              {peers.map((peer) => (
                <PeerAddress
                  key={peer}
                  address={peer}
                  {...getCommonAffixLengths(peer, address)}
                  explorerLink={chain ? getBlockExplorerLink(chain, peer) : undefined}
                />
              ))}
            </div>
          ))}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}

/**
 * Full-width header row opening a similarity band. Tint + card borders live in the table's CSS module
 * (styles.module.css), keyed off `data-band-header` / `data-highlighted`, so they compose with the
 * hover/separator machinery there.
 */
const SimilarityBandHeader = ({ colSpan }: { colSpan: number }) => (
  <TableRow data-band-header="" data-no-hover="" data-no-divider="">
    {/* pl-[26px] aligns the label with the checkbox column; the vertical padding overrides the
        primitive's own p-2 so the head zone hugs its label. */}
    <TableCell colSpan={colSpan} className="pt-2 pr-4 pb-0.5 pl-[26px]">
      {/* Warning accent flips with the theme: dark amber-yellow on the light band, coral on the dark band. */}
      <div className="flex items-center gap-1.5 text-yellow-800 dark:text-[var(--color-warning-main)]">
        <Typography variant="paragraph-mini" className="font-semibold text-inherit">
          Address poisoning warning
        </Typography>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
            <Info size={14} aria-label="About address poisoning" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            These accounts have very similar addresses. Carefully verify the full address before selecting one.
          </TooltipContent>
        </Tooltip>
      </div>
    </TableCell>
  </TableRow>
)

/**
 * Band header for the row at `index`, or null unless it starts a new contiguous cluster run.
 * Shared by both table bodies so the "open a band once per run" rule lives once.
 */
export const bandHeaderAt = (
  index: number,
  clusterIdAt: (index: number) => string | undefined,
  colSpan: number,
): ReactElement | null => {
  const clusterId = clusterIdAt(index)
  if (!clusterId) return null
  const previous = index > 0 ? clusterIdAt(index - 1) : undefined
  return clusterId === previous ? null : <SimilarityBandHeader key={`band-${clusterId}`} colSpan={colSpan} />
}
