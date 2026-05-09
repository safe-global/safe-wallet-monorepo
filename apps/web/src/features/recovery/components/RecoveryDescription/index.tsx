import { Typography } from '@mui/material'
import { useMemo } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useIsRecoverer } from '@/features/recovery/hooks/useIsRecoverer'
import useSafeInfo from '@/hooks/useSafeInfo'
import { logError, Errors } from '@/services/exceptions'
import { getRecoveredSafeInfo } from '@/features/recovery/services/transaction-list'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

export default function RecoveryDescription({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { args, isMalicious } = item
  const { safe } = useSafeInfo()
  const isRecoverer = useIsRecoverer()

  const newSetup = useMemo(() => {
    try {
      return getRecoveredSafeInfo(safe, {
        to: args.to,
        value: args.value.toString(),
        data: args.data,
      })
    } catch (e) {
      logError(Errors._811, e)
    }
    // We only render the threshold and owners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.data, args.to, args.value, safe.threshold, safe.owners])

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
        <Typography fontWeight={700} gutterBottom>
          Required confirmations for new transactions:
        </Typography>
        <Typography>
          {newSetup.threshold} out of {newSetup.owners.length} owner(s)
        </Typography>
      </div>
    </InfoDetails>
  )
}
