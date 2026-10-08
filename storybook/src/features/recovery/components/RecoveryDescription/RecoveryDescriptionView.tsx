import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import ErrorMessage from '@/components/tx/ErrorMessage'

export type RecoveryDescriptionViewProps = {
  isMalicious: boolean
  isRecoverer: boolean
  /** Undefined when the recovered setup cannot be derived. */
  newSetup?: { owners: Array<{ value: string }>; threshold: number }
}

export function RecoveryDescriptionView({
  isMalicious,
  isRecoverer,
  newSetup,
}: RecoveryDescriptionViewProps): ReactElement {
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
