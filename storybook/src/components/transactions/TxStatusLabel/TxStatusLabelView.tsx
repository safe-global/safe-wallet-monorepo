import type { ReactElement } from 'react'
import { Spinner } from '@/components/ui/spinner'

export type TxStatusTone = 'success' | 'error' | 'warning' | 'default'

const TONE_COLORS: Record<TxStatusTone, string> = {
  success: 'var(--color-success-main)',
  error: 'var(--color-error-main)',
  warning: 'var(--color-warning-main)',
  default: 'var(--color-primary-main)',
}

export type TxStatusLabelViewProps = {
  tone: TxStatusTone
  label: string
  isPending: boolean
}

export const TxStatusLabelView = ({ tone, label, isPending }: TxStatusLabelViewProps): ReactElement => {
  return (
    <span
      className="flex items-center gap-2 text-xs font-bold"
      style={{ color: TONE_COLORS[tone] }}
      data-testid="tx-status-label"
    >
      {isPending && <Spinner className="size-3.5" />}
      {label}
    </span>
  )
}
