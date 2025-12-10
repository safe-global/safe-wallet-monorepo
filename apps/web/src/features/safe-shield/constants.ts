import type { Severity } from '@safe-global/utils/features/safe-shield/types'

export const SEVERITY_COLORS: Record<Severity, Record<'main' | 'background', string>> = {
  CRITICAL: { main: 'var(--color-error-main)', background: 'var(--color-error-background)' },
  WARN: { main: 'var(--color-warning-main)', background: 'var(--color-warning-background)' },
  OK: { main: 'var(--color-success-main)', background: 'var(--color-success-background)' },
  INFO: { main: 'var(--color-info-main)', background: 'var(--color-info-background)' },
  ERROR: { main: 'var(--color-warning-main)', background: 'var(--color-warning-background)' },
}
