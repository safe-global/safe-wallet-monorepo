import type { WalletKitTypes } from '@reown/walletkit'
import type { ReactElement } from 'react'
import { getPeerName } from '../../services/utils'
import { ProposalVerificationView } from '@views/features/walletconnect/components/WcProposalForm/ProposalVerificationView'

const ProposalVerification = ({ proposal }: { proposal: WalletKitTypes.SessionProposal }): ReactElement | null => {
  const { isScam, validation } = proposal.verifyContext.verified

  if (validation === 'UNKNOWN' || validation === 'VALID') {
    return null
  }

  const appName = getPeerName(proposal.params.proposer)

  return <ProposalVerificationView isScam={isScam} appName={appName} />
}
export default ProposalVerification
