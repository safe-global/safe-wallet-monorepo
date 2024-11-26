import type { WalletKitTypes } from '@reown/walletkit'
import { Alert, SvgIcon } from '@mui/material'
import AlertIcon from '@/public/images/notifications/alert.svg'
import type { ReactElement } from 'react'
import { getPeerName } from '@/features/walletconnect/services/utils'
import css from './styles.module.css'

const ProposalVerification = ({ proposal }: { proposal: WalletKitTypes.SessionProposal }): ReactElement | null => {
  const { isScam, validation } = proposal.verifyContext.verified

  if (validation === 'UNKNOWN' || validation === 'VALID') {
    return null
  }

  const appName = getPeerName(proposal.params.proposer)

  return (
    <Alert
      severity="error"
      sx={{ bgcolor: 'error.background' }}
      className={css.alert}
      icon={
        <SvgIcon
          component={AlertIcon}
          inheritViewBox
          color="error"
          sx={{
            '& path': {
              fill: 'error.main',
            },
          }}
        />
      }
    >
      {isScam
        ? `We prevent connecting to ${appName || 'this dApp'} as they are a known scam.`
        : `${
            appName || 'This dApp'
          } has a domain that does not match the sender of this request. Approving it may result in a loss of funds.`}
    </Alert>
  )
}
export default ProposalVerification
