import type { ReactElement } from 'react'
import { CircleCheck, CircleMinus, CircleHelp, TriangleAlert, CircleAlert, OctagonAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SafeGrade, ScanResult, SecurityGrade } from '@/features/security/types'

/**
 * A severity "tone" — the icon glyph + theme color used wherever security severity
 * is surfaced. Single source of truth so the drawer's per-check rows (StatusIcon) and the
 * SafeGrade chips render the exact same icons.
 *
 * `color` stays a theme token path (e.g. `'error.main'`); consumers such as `primitives.tsx`
 * convert it to a CSS var themselves, so it must not be pre-converted here.
 */
export type SeverityTone = { Icon: LucideIcon; color: string }

// Converts a theme palette token path (e.g. "success.main") to its theme CSS var (vars.css).
// Plain colors (no dot) are returned untouched.
const tokenToCssVar = (color: string): string =>
  color.includes('.') ? `var(--color-${color.replace(/\./g, '-')})` : color

/**
 * The most-severe tone — a filled "dangerous" octagon in the darker error shade. Shared by
 * the `critical` SafeGrade chip and any Critical-severity failing check in the report drawer.
 */
export const CRITICAL_TONE: SeverityTone = { Icon: OctagonAlert, color: 'error.dark' }

/** Per-check status tones — drives the leading icon on each row inside the report drawer. */
export const STATUS_TONE: Record<ScanResult['status'], SeverityTone> = {
  clear: { Icon: CircleCheck, color: 'success.main' },
  not_applicable: { Icon: CircleMinus, color: 'text.secondary' },
  inconclusive: { Icon: CircleHelp, color: 'text.disabled' },
  partial: { Icon: TriangleAlert, color: 'warning.main' },
  issue: { Icon: CircleAlert, color: 'error.main' },
}

/**
 * Resolves the row tone for a check, escalating a Critical-severity failing check to the
 * `CRITICAL_TONE` "dangerous" glyph so the drawer matches the critical SafeGrade chip.
 */
export const resolveStatusTone = (status: ScanResult['status'], severity?: SecurityGrade): SeverityTone =>
  status === 'issue' && severity === 'Critical' ? CRITICAL_TONE : STATUS_TONE[status]

/**
 * Per-Safe grade tones — drives the SafeGrade chip icon. Reuses the report drawer's glyphs:
 * passing→clear, needs_attention→partial, at_risk→issue. `critical` gets the shared
 * `CRITICAL_TONE` "dangerous" glyph so it reads as the most severe.
 */
export const GRADE_TONE: Record<SafeGrade, SeverityTone> = {
  passing: { Icon: CircleCheck, color: 'success.main' },
  needs_attention: { Icon: TriangleAlert, color: 'score.reviewText' },
  at_risk: { Icon: CircleAlert, color: 'warning.main' },
  critical: CRITICAL_TONE,
}

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
