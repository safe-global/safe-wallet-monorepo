import type { ReactElement } from 'react'
import { Alert, SvgIcon, Tooltip } from '@mui/material'
import type { AlertColor } from '@mui/material'

import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { UntrustedFallbackHandlerTxText } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'

const Warning = ({
  datatestid,
  title,
  text,
  severity,
}: {
  datatestid?: String
  title: string | ReactElement
  text: string
  severity: AlertColor
}): ReactElement => {
  return (
    <Tooltip data-testid={datatestid} title={title} placement="top-start" arrow>
      <Alert
        className={css.alert}
        sx={{ borderLeft: ({ palette }) => `3px solid ${palette[severity].main} !important`, alignItems: 'center' }}
        severity={severity}
        icon={<SvgIcon component={InfoOutlinedIcon} inheritViewBox color={severity} />}
      >
        <b>{text}</b>
      </Alert>
    </Tooltip>
  )
}

export const DelegateCallWarning = ({
  txData,
  showWarning,
}: {
  txData: TransactionDetails['txData']
  showWarning: boolean
}): ReactElement => {
  const isDelegateCall = txData?.operation === Operation.DELEGATE
  const trustedDelegateCall = isDelegateCall && !!txData?.trustedDelegateCallTarget

  if (!isDelegateCall || (!trustedDelegateCall && !showWarning)) return <></>

  return (
    <Warning
      datatestid="delegate-call-warning"
      title={
        <>
          This transaction calls a smart contract that will be able to modify your Safe Account.
          {!trustedDelegateCall && (
            <>
              <br />
              <ExternalLink href={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL}>Learn more</ExternalLink>
            </>
          )}
        </>
      }
      severity={trustedDelegateCall ? 'success' : 'warning'}
      text={trustedDelegateCall ? 'Delegate call' : 'Unexpected delegate call'}
    />
  )
}

export const UntrustedFallbackHandlerWarning = ({
  isTxExecuted = false,
}: {
  isTxExecuted?: boolean
}): ReactElement | null => (
  <Warning
    datatestid="untrusted-fallback-handler-warning"
    title={<UntrustedFallbackHandlerTxText isTxExecuted={isTxExecuted} />}
    severity="warning"
    text="Unofficial fallback handler"
  />
)

export const ThresholdWarning = (): ReactElement => (
  <Warning
    datatestid="threshold-warning"
    title="This transaction potentially alters the number of confirmations required to execute a transaction. Please verify before signing."
    severity="warning"
    text="Confirmation policy change"
  />
)

export const UnsignedWarning = (): ReactElement => (
  <Warning
    title="This transaction is unsigned and could have been created by anyone. To avoid phishing, only sign it if you trust the source of the link."
    severity="error"
    text="Untrusted transaction"
  />
)
