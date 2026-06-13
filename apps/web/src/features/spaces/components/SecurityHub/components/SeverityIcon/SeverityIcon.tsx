import type { ReactElement } from 'react'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DangerousRoundedIcon from '@mui/icons-material/DangerousRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SafeGrade, ScanResult, SecurityGrade } from '@/features/security/types'

/**
 * A severity "tone" — the MUI icon glyph + theme color used wherever security severity
 * is surfaced. Single source of truth so the drawer's per-check rows (StatusIcon) and the
 * SafeGrade chips render the exact same icons.
 */
export type SeverityTone = { Icon: SvgIconComponent; color: string }

/**
 * The most-severe tone — a filled "dangerous" octagon in the darker error shade. Shared by
 * the `critical` SafeGrade chip and any Critical-severity failing check in the report drawer.
 */
export const CRITICAL_TONE: SeverityTone = { Icon: DangerousRoundedIcon, color: 'error.dark' }

/** Per-check status tones — drives the leading icon on each row inside the report drawer. */
export const STATUS_TONE: Record<ScanResult['status'], SeverityTone> = {
  clear: { Icon: CheckCircleOutlineRoundedIcon, color: 'success.main' },
  not_applicable: { Icon: RemoveCircleOutlineRoundedIcon, color: 'text.secondary' },
  inconclusive: { Icon: HelpOutlineRoundedIcon, color: 'text.disabled' },
  partial: { Icon: WarningAmberRoundedIcon, color: 'warning.main' },
  issue: { Icon: ErrorOutlineRoundedIcon, color: 'error.main' },
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
  passing: { Icon: CheckCircleOutlineRoundedIcon, color: 'success.main' },
  needs_attention: { Icon: WarningAmberRoundedIcon, color: 'score.reviewText' },
  at_risk: { Icon: ErrorOutlineRoundedIcon, color: 'warning.main' },
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
  return <Icon sx={{ fontSize, color, flexShrink: 0 }} role="img" aria-label={ariaLabel} />
}
