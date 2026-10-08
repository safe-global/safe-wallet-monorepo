import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useCallback, useContext, useEffect } from 'react'
import type { PropsWithChildren, ReactElement } from 'react'

import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { OwnerList } from '../../common/OwnerList'
import { SafeTxContext } from '../../SafeTxProvider'
import type { RecoveryFlowProps } from '.'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { RemoveRecoveryFlowReviewView } from '@views/components/tx-flow/flows/RemoveRecovery/RemoveRecoveryFlowReviewView'

export function RemoveRecoveryFlowReview({
  delayModifier,
  onSubmit,
  children,
}: PropsWithChildren<RecoveryFlowProps & { onSubmit: () => void }>): ReactElement {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createRemoveModuleTx(delayModifier.address).then(setSafeTx).catch(setSafeTxError)
  }, [delayModifier.address, setSafeTx, setSafeTxError])

  const onFormSubmit = useCallback(() => {
    trackEvent({ ...RECOVERY_EVENTS.SUBMIT_RECOVERY_REMOVE })
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <RemoveRecoveryFlowReviewView
        recoverers={delayModifier.recoverers}
        renderOwnerList={(props) => <OwnerList {...props} />}
      />

      {children}
    </ReviewTransaction>
  )
}
