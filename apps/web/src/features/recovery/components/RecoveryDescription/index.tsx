import { Typography } from '@/components/ui/typography'
import { useMemo } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useIsRecoverer } from '../../hooks/useIsRecoverer'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Errors } from '@/services/exceptions'
import useLogError from '@/hooks/useLogError'
import { getRecoveredSafeInfo } from '../../services/transaction-list'
import type { RecoveryQueueItem } from '../../services/recovery-state'

export default function RecoveryDescription({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { args, isMalicious } = item
  const { safe } = useSafeInfo()
  const isRecoverer = useIsRecoverer()

  // The failure is carried out of the memo rather than reported inside it:
  // `safe.owners` is a new array on every safe-info refresh, so the memo
  // re-evaluates — and re-throws — for reasons that have nothing to do with the
  // proposal, and this component renders once per queued proposal.
  const { newSetup, recoveryError } = useMemo<{
    newSetup?: ReturnType<typeof getRecoveredSafeInfo>
    recoveryError?: unknown
  }>(() => {
    try {
      return {
        newSetup: getRecoveredSafeInfo(safe, {
          to: args.to,
          value: args.value.toString(),
          data: args.data,
        }),
      }
    } catch (e) {
      return { recoveryError: e }
    }
    // We only render the threshold and owners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.data, args.to, args.value, safe.threshold, safe.owners])

  useLogError(Errors._811, recoveryError)

  if (isMalicious) {
    return (
      <ErrorMessage>This transaction potentially calls malicious actions. We recommend cancelling it.</ErrorMessage>
    )
  }

  // TODO: Improve by using Tenderly to check if the proposal will fail
  if (!newSetup || newSetup.owners.length === 0) {
    return (
      <ErrorMessage>
        This recovery proposal will fail as the owner structure has since been modified. We recommend cancelling it
        {isRecoverer ? ' and trying again' : ''}.
      </ErrorMessage>
    )
  }

  return (
    <InfoDetails title="Add signer(s):">
      {newSetup.owners.map((owner) => (
        <EthHashInfo key={owner.value} address={owner.value} shortAddress={false} showCopyButton hasExplorer />
      ))}

      <div>
        <Typography variant="paragraph-bold" className="mb-2">
          Required confirmations for new transactions:
        </Typography>
        <Typography>
          {newSetup.threshold} out of {newSetup.owners.length} owner(s)
        </Typography>
      </div>
    </InfoDetails>
  )
}
