import type { ReactNode } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { TriangleAlert, Info, Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SimilarWarning } from '@/features/address-poisoning'

export type PeerAddressViewProps = {
  address: string
  copied: boolean
  onCopy: () => void
}

/**
 * Full address + inline copy for the warning tooltip. A bare button, not CopyAddressButton — its
 * hover tint and nested Tooltip are both wrong inside this dark hover popup.
 */
export const PeerAddressView = ({ address, copied, onCopy }: PeerAddressViewProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap font-mono text-xs">{address}</span>
      <button
        type="button"
        aria-label="Copy address"
        className="inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-background/15"
        onClick={onCopy}
      >
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      </button>
    </div>
  )
}

export type SimilarityWarningIconViewProps = {
  warning: SimilarWarning
  renderPeerAddress: (address: string) => ReactNode
}

/** Inline ⚠️ after a name, listing cross-list look-alike peers in its tooltip (same-list = band only). */
export const SimilarityWarningIconView = ({ warning, renderPeerAddress }: SimilarityWarningIconViewProps) => {
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
              {peers.map((address) => renderPeerAddress(address))}
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
export const SimilarityBandHeaderView = ({ colSpan }: { colSpan: number }) => (
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
