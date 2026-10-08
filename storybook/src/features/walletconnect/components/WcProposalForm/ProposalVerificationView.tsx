import { Alert, AlertDescription } from '@/components/ui/alert'
import AlertIcon from '@/public/images/notifications/alert.svg'
import type { ReactElement } from 'react'
import css from './styles.module.css'

export type ProposalVerificationViewProps = {
  isScam?: boolean
  appName?: string
}

export const ProposalVerificationView = ({ isScam, appName }: ProposalVerificationViewProps): ReactElement => {
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
