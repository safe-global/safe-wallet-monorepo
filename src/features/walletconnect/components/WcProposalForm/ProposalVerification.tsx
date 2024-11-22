import type { WalletKitTypes } from '@reown/walletkit'
import { Alert, SvgIcon } from '@mui/material'
import type { AlertColor } from '@mui/material'
import AlertIcon from '@/public/images/notifications/alert.svg'
import type { Verify } from '@walletconnect/types'
import type { ComponentType, ReactElement } from 'react'
import CloseIcon from '@/public/images/common/close.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import CheckIcon from '@/public/images/common/check.svg'
import { getPeerName } from '@/features/walletconnect/services/utils'
import css from './styles.module.css'

const Validation: {
  [key in Verify.Context['verified']['validation']]: {
    color: AlertColor
    desc: string
    Icon: ComponentType
  }
} = {
  VALID: {
    color: 'success',
    desc: 'has been verified by WalletConnect.',
    Icon: CheckIcon,
  },
  UNKNOWN: {
    color: 'warning',
    desc: 'has not been verified by WalletConnect.',
    Icon: InfoIcon,
  },
  INVALID: {
    color: 'error',
    desc: 'has a domain that does not match the sender of this request. Approving it may result in a loss of funds.',
    Icon: CloseIcon,
  },
}

const ProposalVerification = ({ proposal }: { proposal: WalletKitTypes.SessionProposal }): ReactElement | null => {
  const { isScam, validation } = proposal.verifyContext.verified

  if (validation === 'UNKNOWN') {
    return null
  }

  const _validation = Validation[validation]
  const color = isScam ? 'error' : _validation.color
  const Icon = isScam ? AlertIcon : _validation.Icon

  return (
    <Alert
      severity={color}
      sx={{ bgcolor: ({ palette }) => palette[color].background }}
      className={css.alert}
      icon={
        <SvgIcon
          component={Icon}
          inheritViewBox
          color={color}
          sx={{
            '& path': {
              fill: ({ palette }) => palette[color].main,
            },
          }}
        />
      }
    >
      {isScam
        ? `We prevent connecting to ${getPeerName(proposer) || 'this dApp'} as they are a known scam.`
        : `${getPeerName(proposer) || 'This dApp'} ${_validation.desc}`}
    </Alert>
  )
}
export default ProposalVerification
