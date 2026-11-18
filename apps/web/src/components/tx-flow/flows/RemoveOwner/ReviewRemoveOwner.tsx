import { useCallback, useContext, useEffect } from 'react'
import type { ReactElement, PropsWithChildren } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { createRemoveOwnerTx } from '@/services/tx/tx-sender/create'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import type { RemoveOwnerFlowProps } from '.'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

export const ReviewRemoveOwner = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{
  params: RemoveOwnerFlowProps
  onSubmit: () => void
}>): ReactElement => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const { removedOwner, threshold } = params

  useEffect(() => {
    createRemoveOwnerTx({ ownerAddress: removedOwner.address, threshold }).then(setSafeTx).catch(setSafeTxError)
  }, [removedOwner.address, setSafeTx, setSafeTxError, threshold])

  const onFormSubmit = useCallback(() => {
    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: safe.threshold })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: safe.owners.length })
    onSubmit()
  }, [onSubmit, safe.threshold, safe.owners])

  return <ReviewTransaction onSubmit={onFormSubmit}>{children}</ReviewTransaction>
}
