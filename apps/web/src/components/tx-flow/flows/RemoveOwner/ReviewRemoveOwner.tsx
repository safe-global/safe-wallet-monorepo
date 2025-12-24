import { useCallback, useContext, useEffect } from 'react'
import type { ReactElement, PropsWithChildren } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveOwnerTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
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
  const { setSafeTx, setSafeTxError, setIsReadOnly } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const { removedOwner, threshold } = params

  useEffect(() => {
    createRemoveOwnerTx({ ownerAddress: removedOwner.address, threshold }).then(setSafeTx).catch(setSafeTxError)
  }, [removedOwner.address, setSafeTx, setSafeTxError, threshold])

  // Mark as readonly to prevent SafeTxProvider from recreating with createTx()
  useEffect(() => {
    setIsReadOnly(true)
  }, [setIsReadOnly])

  const onFormSubmit = useCallback(() => {
    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: safe.threshold })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: safe.owners.length })
    onSubmit()
  }, [onSubmit, safe.threshold, safe.owners])

  return <ReviewTransaction onSubmit={onFormSubmit}>{children}</ReviewTransaction>
}
