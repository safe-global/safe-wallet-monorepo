import type { ReactElement } from 'react'
import { Box, Tooltip } from '@mui/material'
import { TriangleAlert } from 'lucide-react'
import { getAddress } from 'ethers'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

/**
 * Synthetic match for the intra-list surfaces (nested-safes curate, onboarding, add-accounts):
 * their old engine buckets on front AND back, so a flag is always a both-ends (CRITICAL) hit.
 * Used to drive the shared highlight + flag without an anchor (no trusted reference exists yet).
 */
export const INTRA_LIST_MATCH: SimilarityMatch = { anchor: '', prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL }

/**
 * Mode B list flag: a compact pill (with an explanatory tooltip) marking a list row whose address
 * resembles either a trusted anchor (anchor mode) or another address in the same list (`intraList`
 * mode — used where nothing is trusted yet, e.g. picking which owned Safes to add). Two tiers, same
 * pattern, tone-differentiated: both-ends → red "High risk"; one-end → amber "Caution" — matching the
 * Mode A card chips. Renders nothing when there is no match.
 */
const SimilarityFlag = ({
  match,
  anchorName,
  intraList = false,
  iconOnly = false,
}: {
  match?: SimilarityMatch | null
  anchorName?: string
  intraList?: boolean
  /** Render just the tone-coloured warning icon (with tooltip), no pill/label — e.g. next to a name. */
  iconOnly?: boolean
}): ReactElement | null => {
  if (!match) return null

  const isCritical = match.severity === Severity.CRITICAL
  const label = isCritical ? 'High risk' : 'Caution'
  const toneColor = isCritical ? 'var(--color-error-dark)' : 'var(--color-warning-dark)'

  let tip: string
  if (intraList) {
    // No trusted reference at selection time — warn that two list entries collide.
    tip = 'This address closely resembles another one in this list. Verify carefully before you select it.'
  } else {
    let anchor = `0x${match.anchor}`
    try {
      anchor = getAddress(anchor)
    } catch {
      // keep the lowercase form if the anchor isn't a valid checksum
    }
    const name = anchorName || shortenAddress(anchor)
    tip = isCritical
      ? `Looks like ${name}, an address you trust — the middle differs. Verify before using it.`
      : `Shares the visible characters with ${name}, an address you trust. This could be a coincidence — verify.`
  }

  if (iconOnly) {
    return (
      <Tooltip title={tip} arrow>
        <Box component="span" role="status" aria-label={tip} sx={{ display: 'inline-flex', lineHeight: 0 }}>
          <TriangleAlert size={16} style={{ width: 16, height: 16, color: toneColor, stroke: toneColor }} />
        </Box>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={tip} arrow>
      <Box
        component="span"
        role="status"
        aria-label={tip}
        // Colour set via inline `style` (not just sx) so host hover/focus rules that force a text
        // colour on descendants (e.g. shadcn SelectItem's `focus:**:text-accent-foreground`) can't
        // repaint the pill on hover.
        style={{ color: toneColor }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: '2px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          cursor: 'default',
          // Hug the label — never stretch to fill a flex-column parent (kept the pill full-width before).
          width: 'fit-content',
          maxWidth: '100%',
          bgcolor: isCritical ? 'var(--color-error-background)' : 'var(--color-warning-background)',
        }}
      >
        {/* Pin colour AND size inline so host rules can't repaint (SelectItem's focus:**:text-…) or
            resize (SelectItem's [&_svg]:size-4) the icon — keeps the pill identical across surfaces. */}
        <TriangleAlert
          size={12}
          style={{ flexShrink: 0, width: 12, height: 12, color: toneColor, stroke: toneColor }}
        />
        {label}
      </Box>
    </Tooltip>
  )
}

export default SimilarityFlag
