import { Chip, type ChipProps } from '@mui/material'
import type { SafeGrade } from '@/features/security/types'

/** Human-readable label per SafeGrade. Shared by every chip in the SecurityHub UI. */
export const SAFE_GRADE_LABEL: Record<SafeGrade, string> = {
  critical: 'Critical',
  at_risk: 'At risk',
  needs_attention: 'Needs review',
  passing: 'Healthy',
}

/**
 * Color tokens per SafeGrade.
 * - `accent` is the strong color (foreground text when soft, background when active).
 * - `bg`     is the paired soft background (chip fill in the default soft variant).
 *
 * Both static "status" chips (StatusCell) and the interactive filter chips
 * (WorkspaceHealthCard) compose their styling from this pair.
 */
export const SAFE_GRADE_PALETTE: Record<SafeGrade, { accent: string; bg: string }> = {
  critical: { accent: 'error.dark', bg: 'error.background' },
  at_risk: { accent: 'error.main', bg: 'error.background' },
  needs_attention: { accent: 'warning.main', bg: 'warning.background' },
  passing: { accent: 'success.main', bg: 'success.background' },
}

export type SafeGradeChipProps = Omit<ChipProps, 'color'> & {
  grade: SafeGrade
  /** When true, render filled (accent background, paper text). Default is soft (bg + accent text). */
  active?: boolean
  /** Override the default grade label (e.g. prefix a count like "3 Critical"). */
  label?: string
}

/**
 * Single visual primitive for SafeGrade chips. Encapsulates label/palette lookup,
 * size/weight, and the soft-vs-active variant; consumers add their own `sx` overrides
 * (height, transition, hover) for context-specific tweaks.
 */
const SafeGradeChip = ({ grade, active = false, label, onClick, sx, ...chipProps }: SafeGradeChipProps) => {
  const { accent, bg } = SAFE_GRADE_PALETTE[grade]
  const backgroundColor = active ? accent : bg
  const color = active ? 'background.paper' : accent
  return (
    <Chip
      label={label ?? SAFE_GRADE_LABEL[grade]}
      size="small"
      onClick={onClick}
      sx={{
        backgroundColor,
        color,
        fontWeight: 700,
        '& .MuiChip-label': { px: 1 },
        ...(onClick && {
          cursor: 'pointer',
          transition: 'background-color 0.15s, color 0.15s',
          '&:hover': { backgroundColor, color, opacity: 0.8 },
        }),
        ...sx,
      }}
      {...chipProps}
    />
  )
}

export default SafeGradeChip
