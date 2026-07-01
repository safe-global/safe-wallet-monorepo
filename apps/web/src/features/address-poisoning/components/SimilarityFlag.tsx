import type { ReactElement } from 'react'
import { Box, Tooltip } from '@mui/material'
import { TriangleAlert } from 'lucide-react'
import { getAddress } from 'ethers'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

/**
 * Mode B list flag: a compact pill (with an explanatory tooltip) marking a list row whose
 * address resembles a trusted anchor. Two tiers, same pattern, tone-differentiated:
 * both-ends match → red "High risk"; one-end match → amber "Caution" — matching the Mode A
 * card chips. Renders nothing when there is no match.
 */
const SimilarityFlag = ({
  match,
  anchorName,
}: {
  match?: SimilarityMatch | null
  anchorName?: string
}): ReactElement | null => {
  if (!match) return null

  const isCritical = match.severity === Severity.CRITICAL
  const label = isCritical ? 'High risk' : 'Caution'

  let anchor = `0x${match.anchor}`
  try {
    anchor = getAddress(anchor)
  } catch {
    // keep the lowercase form if the anchor isn't a valid checksum
  }
  const name = anchorName || shortenAddress(anchor)

  const tip = isCritical
    ? `Looks like ${name}, an address you trust — the middle differs. Verify before using it.`
    : `Shares the visible characters with ${name}, an address you trust. This could be a coincidence — verify.`

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
