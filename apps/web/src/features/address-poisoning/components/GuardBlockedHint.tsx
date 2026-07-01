import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import { Lock } from 'lucide-react'
import type { BlockedHint } from '../hooks/useAddressPoisoningGuard'

/**
 * The button-side "verify to continue" cue for the address-poisoning guard. Drop it next to a
 * host's primary action button and feed it the `hint` reported by the guard's `onBlockedChange`.
 * Renders nothing until the guard is blocking. Colour matches the warning card via --color-* tokens.
 */
const GuardBlockedHint = ({ hint }: { hint?: BlockedHint }): ReactElement | null => {
  if (!hint) return null
  return (
    <Typography
      role="status"
      variant="body2"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        fontWeight: 500,
        lineHeight: 1.4,
        color: hint.tone === 'critical' ? 'var(--color-error-dark)' : 'var(--color-warning-dark)',
      }}
    >
      <Lock size={14} style={{ flexShrink: 0 }} />
      {hint.text}
    </Typography>
  )
}

export default GuardBlockedHint
