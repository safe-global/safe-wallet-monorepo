import { type ReactElement, type ReactNode } from 'react'
import css from './PlanStatusModal.module.css'

const APPROACHING_THRESHOLD = 0.8

const dotClass = (used: number, total: number): string | null => {
  if (total <= 0) return null
  const ratio = used / total
  if (ratio >= 1) return css.dotError
  if (ratio >= APPROACHING_THRESHOLD) return css.dotWarning
  return null
}

const UsageRow = ({
  icon,
  label,
  used,
  total,
  format,
  testId,
  withStatusDot = false,
}: {
  icon: ReactNode
  label: string
  used: number
  total: number
  format: (value: number) => string
  testId: string
  withStatusDot?: boolean
}): ReactElement => {
  const remaining = Math.max(total - used, 0)
  const dot = withStatusDot ? dotClass(used, total) : null

  return (
    <div className={css.row} data-testid={testId}>
      <div className={css.rowLabel}>
        <span className={css.rowIcon}>{icon}</span>
        {label}
      </div>
      <div className={css.rowValue}>
        {dot && <span className={`${css.rowDot} ${dot}`} data-testid={`${testId}-dot`} aria-hidden />}
        <span className={css.rowRemaining}>{format(remaining)}</span>
        <span className={css.rowTotal}>/ {format(total)}</span>
      </div>
    </div>
  )
}

export default UsageRow
