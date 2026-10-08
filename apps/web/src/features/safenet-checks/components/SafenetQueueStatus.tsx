import type { ReactElement } from 'react'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { STATUS_PRESENTATION } from '../statusPresentation'
import { SafenetQueueStatusView } from '@views/features/safenet-checks/components/SafenetQueueStatusView'

export type SafenetQueueStatusProps = {
  safeTxHash: string
  /**
   * The queued transaction's submission date, offered to the shared aim
   * registry, which aims the read window with the earliest time any surface
   * knows. The confirm flow offers the same value from `submittedAt`.
   */
  timestampMs: number
}

/**
 * Compact per-row check state for the transaction queue: severity icon plus
 * the PRD state name, full-sentence copy on hover. Renders nothing until a
 * check has been observed for the hash.
 */
export const SafenetQueueStatus = ({ safeTxHash, timestampMs }: SafenetQueueStatusProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (!display) return null

  const { publicStatus } = display
  const { severity, label, copy } = STATUS_PRESENTATION[publicStatus]

  return <SafenetQueueStatusView status={publicStatus} severity={severity} label={label} copy={copy} />
}

export default SafenetQueueStatus
