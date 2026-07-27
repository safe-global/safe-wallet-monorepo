import type { ReactElement } from 'react'
import Box from '@mui/material/Box'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { TriangleAlert, Info, Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import type { SimilarWarning } from '@/features/address-poisoning'

/**
 * Full address + inline copy for the warning tooltip. A bare button rather than the shared
 * CopyAddressButton: that one hard-codes a light-surface hover tint (and wraps its own Tooltip), both
 * wrong inside this dark, hover popup. Hover uses `bg-background/15` so it reads on either theme.
 */
const PeerAddress = ({ address }: { address: string }) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap font-mono text-xs">{address}</span>
      <button
        type="button"
        aria-label="Copy address"
        className="inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-background/15"
        onClick={() => copy(address)}
      >
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      </button>
    </div>
  )
}

/**
 * Inline look-alike marker after a name: a ⚠️ whose tooltip lists the account's similar peers grouped
 * by list. Shown only for cross-list clusters (see SimilarWarning); same-list look-alikes read from the
 * band alone, no icon.
 */
export const SimilarityWarningIcon = ({ warning }: { warning: SimilarWarning }) => {
  const sections = (
    [
      ['Similar accounts from trusted safes:', warning.trusted],
      ['Similar accounts from owned safes:', warning.owned],
    ] as const
  ).filter(([, peers]) => peers.length > 0)

  return (
    // The icon lives inside a selectable/navigable row — swallow the click so interacting with it
    // (or the tooltip) never toggles selection or navigates.
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
              {peers.map((address) => (
                <PeerAddress key={address} address={address} />
              ))}
            </div>
          ))}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}

/**
 * Full-width header row that opens an address-poisoning similarity band. The band tint + per-card
 * borders live in the Table sx (keyed off the `data-band-header` / `data-highlighted` attributes)
 * so they compose with the cell-level hover/separator machinery.
 */
export const SimilarityBandHeader = ({ colSpan }: { colSpan: number }) => (
  <TableRow data-band-header="">
    <TableCell colSpan={colSpan} sx={{ py: 0.75, px: 2 }}>
      {/* Warning accent flips with the theme: dark amber-yellow on the light band, coral on the dark band. */}
      <Box
        className="text-yellow-800 dark:text-[var(--color-warning-main)]"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
      >
        <TriangleAlert size={16} aria-hidden />
        <Typography variant="caption" fontWeight={600} color="inherit">
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
      </Box>
    </TableCell>
  </TableRow>
)

/**
 * The band-opening header for the row at `index`, or null if it doesn't start a new contiguous cluster
 * run. `clusterIdAt` maps a row index → its cluster id (undefined = not in a band). Shared by both the
 * non-reorder body and the reorderable pinned block so the "open a band once per run" rule lives once.
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
