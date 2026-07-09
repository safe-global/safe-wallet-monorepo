import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { TxModalContext } from '../..'
import TxCard from '../../common/TxCard'
import { TxFlowContext } from '../../TxFlowProvider'
import { Typography } from '@/components/ui/typography'
import DialogActions from '@/components/common/DialogActions'

export function CancelRecoveryOverview(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { onNext } = useContext(TxFlowContext)

  const onClose = () => {
    setTxFlow(undefined)
    trackEvent(RECOVERY_EVENTS.GO_BACK)
  }

  return (
    <TxCard>
      <div className="flex flex-col items-center md:p-10">
        {/* TODO: Replace with correct icon when provided */}
        <ReplaceTxIcon />

        <Typography variant="h4" align="center" className="mt-10 mb-2">
          Do you want to cancel the Account recovery?
        </Typography>

        <Typography variant="paragraph-small" align="center" className="mb-6 block">
          If it is an unwanted recovery proposal or you&apos;ve noticed something suspicious, you can cancel it at any
          time.
        </Typography>

        <DialogActions
          onCancel={onClose}
          cancelLabel="Go back"
          onConfirm={onNext}
          confirmLabel="Yes, cancel proposal"
          confirmTestId="cancel-proposal-btn"
        />
      </div>
    </TxCard>
  )
}
