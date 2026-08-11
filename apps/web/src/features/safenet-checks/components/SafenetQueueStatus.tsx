import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { STATUS_PRESENTATION } from '../statusPresentation'

export type SafenetQueueStatusProps = {
  safeTxHash: string
  /**
   * Submission time from the queue summary; aims the reader's block window.
   * Required: the cache keys by hash and the last fetch's args aim every
   * later poll, so an unaimed subscription would poison every surface.
   */
  timestampMs: number
}

/**
 * Compact per-row check state for the transaction queue: severity icon plus
 * the PRD state name, full-sentence copy on hover. Renders nothing until a
 * check has been observed for the hash.
 */
export const SafenetQueueStatus = ({ safeTxHash, timestampMs }: SafenetQueueStatusProps): ReactElement | null => {
  const { publicStatus } = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (publicStatus === CheckStatus.UNAVAILABLE) return null

  const { severity, label, copy } = STATUS_PRESENTATION[publicStatus]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div data-testid="safenet-queue-status" data-status={publicStatus} className="inline-flex items-center gap-1">
            <SeverityIcon severity={severity} />
            <Typography variant="paragraph-mini" className="text-muted-foreground">
              {label}
            </Typography>
          </div>
        }
      />
      <TooltipContent side="top">{copy}</TooltipContent>
    </Tooltip>
  )
}

export default SafenetQueueStatus
