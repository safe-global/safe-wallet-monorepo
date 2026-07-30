import type { ReactElement } from 'react'
import { Chip, Tooltip } from '@mui/material'

/**
 * Marks a policy bound to the guard's catch-all access. It applies to any transaction
 * no other policy matches, so it's worth calling out next to the specific rules.
 */
export const FallbackBadge = ({ size = 'small' }: { size?: 'small' | 'medium' }): ReactElement => (
  <Tooltip title="Applies to any transaction that no other policy covers">
    <Chip
      size={size}
      variant="outlined"
      label="Fallback"
      sx={{ height: 18, fontSize: 10, fontWeight: 700, letterSpacing: '0.3px', cursor: 'default' }}
    />
  </Tooltip>
)

export default FallbackBadge
