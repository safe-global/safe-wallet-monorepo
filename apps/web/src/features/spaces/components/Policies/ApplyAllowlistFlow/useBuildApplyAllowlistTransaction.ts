import { useContext, useEffect } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature, type PolicyConfiguration } from '@/features/policy-guard'
import { createTx } from '@/services/tx/tx-sender/create'

/** Sets the `applyConfiguration` call that commits a requested root, replaying the configurations CGW stored for it. */
export const useBuildApplyAllowlistTransaction = (
  guardAddress: string,
  configurations: PolicyConfiguration[],
): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { createApplyConfigurationTx, $isReady } = useLoadFeature(PolicyGuardFeature)
  const sdk = scope?.sdk
  // Keyed by value so an equal but re-created array does not rebuild the transaction.
  const configurationsKey = JSON.stringify(configurations)

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!$isReady || !sdk) return

    let isStale = false
    createTx(createApplyConfigurationTx(guardAddress, JSON.parse(configurationsKey)), undefined, scope)
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
  }, [guardAddress, configurationsKey, sdk, $isReady, createApplyConfigurationTx, setSafeTx, setSafeTxError])
}
