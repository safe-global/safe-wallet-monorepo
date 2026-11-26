import { useContext, useEffect } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { createApplyConfigurationTx } from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHasFeature } from '@/hooks/useChains'
import { createTx } from '@/services/tx/tx-sender/create'

/** Sets the `applyConfiguration` call that commits a requested root, replaying the configurations CGW stored for it. */
export const useBuildApplyAllowlistTransaction = (
  guardAddress: string,
  configurations: PolicyConfiguration[],
): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const sdk = scope?.sdk
  // Keyed by value so an equal but re-created array does not rebuild the transaction.
  const configurationsKey = JSON.stringify(configurations)

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!isAllowlistEnabled || !sdk) return

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
  }, [guardAddress, configurationsKey, sdk, isAllowlistEnabled, setSafeTx, setSafeTxError])
}
