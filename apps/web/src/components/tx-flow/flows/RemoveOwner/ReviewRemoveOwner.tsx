import { useCallback, useContext, useEffect, useMemo } from 'react'
import type { ReactElement, PropsWithChildren } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeShieldForDeadlockCheck } from '@/features/safe-shield/SafeShieldContext'
import { createRemoveOwnerTx } from '@/services/tx/tx-sender'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { SafeTxContext } from '../../SafeTxProvider'
import type { RemoveOwnerFlowProps } from '.'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { computeProjectedState } from '@safe-global/utils/features/safe-shield/utils'

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

  const currentOwners = useMemo(() => safe.owners.map((o) => o.value), [safe.owners])

  const projected = useMemo(
    () =>
      computeProjectedState(currentOwners, safe.threshold, {
        type: 'removeOwner',
        ownerAddress: removedOwner.address,
        threshold,
      }),
    [currentOwners, safe.threshold, removedOwner.address, threshold],
  )

  useSafeShieldForDeadlockCheck(safe.address.value, projected.owners, projected.threshold)

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
