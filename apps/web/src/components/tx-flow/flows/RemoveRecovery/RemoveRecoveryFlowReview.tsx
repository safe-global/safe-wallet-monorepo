import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Typography } from '@mui/material'
import { useCallback, useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { OwnerList } from '../../common/OwnerList'
import { SafeTxContext } from '../../SafeTxProvider'
import type { RecoveryFlowProps } from '.'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

export function RemoveRecoveryFlowReview({
  delayModifier,
  onSubmit,
}: RecoveryFlowProps & { onSubmit: () => void }): ReactElement {
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
      <Typography>
        This transaction will remove the recovery module from your Safe Account. You will no longer be able to recover
        your Safe Account once this transaction is executed.
      </Typography>

      <OwnerList
        title="Removing Recoverer"
        owners={delayModifier.recoverers.map((recoverer) => ({ value: recoverer }))}
        sx={{ bgcolor: ({ palette }) => `${palette.warning.background} !important` }}
      />
    </ReviewTransaction>
  )
}
