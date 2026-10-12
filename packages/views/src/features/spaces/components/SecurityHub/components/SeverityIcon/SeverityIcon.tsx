import type { ReactElement } from 'react'
import type { SeverityTone } from './severityTones'

export type { SeverityTone } from './severityTones'

// Converts a theme palette token path (e.g. "success.main") to its theme CSS var (vars.css).
// Plain colors (no dot) are returned untouched.
const tokenToCssVar = (color: string): string =>
  color.includes('.') ? `var(--color-${color.replace(/\./g, '-')})` : color

export type SeverityIconProps = {
  tone: SeverityTone
  /** Icon size in px. Matches the report drawer's row icons by default. */
  fontSize?: number
  ariaLabel?: string
}

/** Renders a severity tone's icon at the shared size/color. */
export const SeverityIcon = ({ tone, fontSize = 18, ariaLabel }: SeverityIconProps): ReactElement => {
  const { Icon, color } = tone
  return (
    <Icon
      size={fontSize}
      className="shrink-0"
      style={{ color: tokenToCssVar(color) }}
      role="img"
      aria-label={ariaLabel}
    />
  )
}

export { CRITICAL_TONE, STATUS_TONE, resolveStatusTone, GRADE_TONE } from './severityTones'
