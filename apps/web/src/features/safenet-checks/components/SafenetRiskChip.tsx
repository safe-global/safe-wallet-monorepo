import type { ReactElement } from 'react'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { SafenetStatusChip } from './SafenetStatusChip'

export type SafenetRiskChipProps = {
  safeTxHash: string | undefined
  /** Submission time; aims the reader's block window. */
  timestampMs?: number | null
}

/** The "Risk detected" chip of a batch item; every other state renders nothing. */
const SafenetRiskChip = ({ safeTxHash, timestampMs }: SafenetRiskChipProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (display?.publicStatus !== CheckStatus.MALICIOUS) return null

  return <SafenetStatusChip publicStatus={display.publicStatus} data-testid="safenet-risk-chip" />
}

export default SafenetRiskChip
