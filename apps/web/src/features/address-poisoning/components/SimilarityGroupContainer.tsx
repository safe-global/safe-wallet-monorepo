import { Box, Typography } from '@mui/material'
import type { ReactElement, ReactNode } from 'react'

/**
 * Frames a cluster of visually-similar addresses under a "verify carefully" header. Tone follows the
 * strongest match in the cluster: red (error) when it contains a both-ends look-alike, otherwise amber
 * (warning). Shared across surfaces that group look-alikes (nested-safe curation, Manage trusted Safes).
 */
export function SimilarityGroupContainer({
  children,
  critical = false,
}: {
  children: ReactNode
  /** Both-ends look-alike present in the cluster → red (high risk); otherwise amber (caution). */
  critical?: boolean
}): ReactElement {
  const tone = critical ? 'error' : 'warning'
  return (
    <Box
      sx={{
        my: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${tone}.light`,
        overflow: 'hidden',
      }}
    >
      {/* Warning header */}
      <Box sx={{ px: 1.5, py: 0.75, backgroundColor: `${tone}.background` }}>
        <Typography variant="caption" fontWeight={500} color={`${tone}.main`}>
          Similar addresses - verify carefully
        </Typography>
      </Box>

      {/* Grouped items */}
      <Box sx={{ backgroundColor: 'background.paper', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </Box>
    </Box>
  )
}
