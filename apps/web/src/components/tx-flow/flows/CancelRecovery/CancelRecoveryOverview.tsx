import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { TxModalContext } from '../..'
import { TxFlowContext } from '../../TxFlowProvider'
import DialogActions from '@/components/common/DialogActions'
import { CancelRecoveryOverviewView } from '@views/components/tx-flow/flows/CancelRecovery/CancelRecoveryOverviewView'

export function CancelRecoveryOverview(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { onNext } = useContext(TxFlowContext)

  const onClose = () => {
    setTxFlow(undefined)
    trackEvent(RECOVERY_EVENTS.GO_BACK)
  }

  return (
    <CancelRecoveryOverviewView
      renderDialogActions={(props) => <DialogActions {...props} onCancel={onClose} onConfirm={onNext} />}
    />
  )
}
