import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeShieldForDeadlockCheck } from '@/features/safe-shield/SafeShieldContext'
import { useContext, useEffect, useMemo, type PropsWithChildren } from 'react'

import { createUpdateThresholdTx } from '@/services/tx/tx-sender'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { ChangeThresholdFlowFieldNames } from '@/components/tx-flow/flows/ChangeThreshold'
import type { ChangeThresholdFlowProps } from '@/components/tx-flow/flows/ChangeThreshold'

import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { computeProjectedState } from '@safe-global/utils/features/safe-shield/utils'

const ReviewChangeThreshold = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: ChangeThresholdFlowProps; onSubmit: () => void }>) => {
  const { safe } = useSafeInfo()
  const newThreshold = params[ChangeThresholdFlowFieldNames.threshold]

  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const currentOwners = useMemo(() => safe.owners.map((o) => o.value), [safe.owners])

  const projected = useMemo(
    () => computeProjectedState(currentOwners, safe.threshold, { type: 'changeThreshold', threshold: newThreshold }),
    [currentOwners, safe.threshold, newThreshold],
  )

  useSafeShieldForDeadlockCheck(safe.address.value, projected.owners, projected.threshold)

  useEffect(() => {
    createUpdateThresholdTx(newThreshold).then(setSafeTx).catch(setSafeTxError)
  }, [newThreshold, setSafeTx, setSafeTxError])

  const trackEvents = () => {
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: safe.owners.length })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: newThreshold })
  }

  const handleSubmit = () => {
    trackEvents()
    onSubmit()
  }

  return <ReviewTransaction onSubmit={handleSubmit}>{children}</ReviewTransaction>
}

export default ReviewChangeThreshold
