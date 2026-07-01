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
}: {
  match?: SimilarityMatch | null
  anchorName?: string
  intraList?: boolean
}): ReactElement | null => {
  if (!match) return null

  const isCritical = match.severity === Severity.CRITICAL
  const label = isCritical ? 'High risk' : 'Caution'

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

  return (
    <Tooltip title={tip} arrow>
      <Box
        component="span"
        role="status"
        aria-label={tip}
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
          bgcolor: isCritical ? 'var(--color-error-background)' : 'var(--color-warning-background)',
          color: isCritical ? 'var(--color-error-dark)' : 'var(--color-warning-dark)',
        }}
      >
        <TriangleAlert size={12} style={{ flexShrink: 0 }} />
        {label}
      </Box>
    </Tooltip>
  )
}

export default SimilarityFlag
