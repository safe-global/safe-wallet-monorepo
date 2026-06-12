import type { WalletKitTypes } from '@reown/walletkit'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AlertIcon from '@/public/images/notifications/alert.svg'
import type { ReactElement } from 'react'
import { getPeerName } from '../../services/utils'
import css from './styles.module.css'

const ProposalVerification = ({ proposal }: { proposal: WalletKitTypes.SessionProposal }): ReactElement | null => {
  const { isScam, validation } = proposal.verifyContext.verified

  if (validation === 'UNKNOWN' || validation === 'VALID') {
    return null
  }

  const appName = getPeerName(proposal.params.proposer)

  return (
    <Alert variant="destructive" className={css.alert}>
      <AlertIcon className="size-6 [&_path]:fill-[var(--color-error-main)]" />
      <AlertDescription>
        {isScam
          ? `We prevent connecting to ${appName || 'this dApp'} as they are a known scam.`
          : `${
              appName || 'This dApp'
            } has a domain that does not match the sender of this request. Approving it may result in a loss of funds.`}
      </AlertDescription>
    </Alert>
  )
}
export default ProposalVerification
