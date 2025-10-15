import { type Severity } from './types'

// Widget title for each severity
export const SEVERITY_TO_TITLE: Record<Severity, string> = {
  CRITICAL: 'Risk detected',
  WARN: 'Issues found',
  INFO: 'Review details',
  OK: 'Checks passed',
}
