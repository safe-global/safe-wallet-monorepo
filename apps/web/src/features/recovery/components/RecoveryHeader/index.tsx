import { Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'
import { useIsRecoverer } from '@/features/recovery/hooks/useIsRecoverer'
import madProps from '@/utils/mad-props'
import { RecoveryProposalCard } from '@/features/recovery/components/RecoveryCards/RecoveryProposalCard'
import { RecoveryInProgressCard } from '@/features/recovery/components/RecoveryCards/RecoveryInProgressCard'
import { WidgetContainer, WidgetBody } from '@/components/dashboard/styled'
import { RecoveryEvent, RecoveryTxType, recoverySubscribe } from '@/features/recovery/services/recoveryEvents'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

function InternalRecoveryHeader({
  isProposalInProgress,
  isRecoverer,
  queue,
}: {
  isProposalInProgress: boolean
  isRecoverer: boolean
  queue: Array<RecoveryQueueItem>
}): ReactElement | null {
  const next = queue[0]

  const modal = next ? (
    <RecoveryInProgressCard orientation="horizontal" recovery={next} />
  ) : isRecoverer && !isProposalInProgress ? (
    <RecoveryProposalCard orientation="horizontal" />
  ) : null

  if (modal) {
    return (
      <Grid item xs={12}>
        <WidgetContainer>
          <WidgetBody>{modal}</WidgetBody>
        </WidgetContainer>
      </Grid>
    )
  }
  return null
}

export function useIsProposalInProgress(): boolean {
  const [isProposalSubmitting, setIsProposalSubmitting] = useState(false)
  const queue = useRecoveryQueue()

  useEffect(() => {
    const unsubFns = Object.values(RecoveryEvent).map((event) =>
      recoverySubscribe(event, (detail) => {
        const isProposal = 'txType' in detail && detail.txType === RecoveryTxType.PROPOSAL
        const isProcessing = event === RecoveryEvent.PROCESSING
        const isLoaded = queue.some((item) => item.args.txHash === detail?.recoveryTxHash)

        setIsProposalSubmitting(isProposal && (isProcessing || !isLoaded))
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [queue])

  return isProposalSubmitting
}

const RecoveryHeader = madProps(InternalRecoveryHeader, {
  isProposalInProgress: useIsProposalInProgress,
  isRecoverer: useIsRecoverer,
  queue: useRecoveryQueue,
})

// Export for tests
export { InternalRecoveryHeader }

export default RecoveryHeader
