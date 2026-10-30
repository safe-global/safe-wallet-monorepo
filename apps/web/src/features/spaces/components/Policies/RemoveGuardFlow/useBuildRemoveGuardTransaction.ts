import { useContext, useEffect } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature } from '@/features/policy-guard'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'

/** Sets the batch that takes the guard off both slots, which an applied removal lets through. */
export const useBuildRemoveGuardTransaction = (): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { createRemoveGuardTxs, $isReady } = useLoadFeature(PolicyGuardFeature)
  const sdk = scope?.sdk
  const safeAddress = scope?.safeAddress

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!$isReady || !sdk || !safeAddress) return

    let isStale = false
    createMultiSendCallOnlyTx(createRemoveGuardTxs(safeAddress), scope)
      .then((tx) => {
        if (!isStale) setSafeTx(tx)
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(asError(e))
      })
    return () => {
      isStale = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `scope` is a new object on every Safe poll
  }, [safeAddress, sdk, $isReady, createRemoveGuardTxs, setSafeTx, setSafeTxError])
}
