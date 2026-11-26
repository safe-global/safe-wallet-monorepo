import { useContext, useEffect } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { createRemoveGuardTxs } from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHasFeature } from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'

/**
 * Sets the batch that takes the guard off both slots and sets `fallbackHandler` back, which an applied removal lets
 * through, and applies the removal's clean-up when given. Waits until `fallbackHandler` is known.
 */
export const useBuildRemoveGuardTransaction = (
  guardAddress: string,
  fallbackHandler?: string,
  cleanupConfigurations?: PolicyConfiguration[],
): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const sdk = scope?.sdk
  const safeAddress = scope?.safeAddress
  // Keyed by value so an equal but re-created array does not rebuild the transaction.
  const cleanupKey = cleanupConfigurations ? JSON.stringify(cleanupConfigurations) : undefined

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!isAllowlistEnabled || !sdk || !safeAddress || !fallbackHandler) return

    const txs = createRemoveGuardTxs({
      safeAddress,
      guardAddress,
      fallbackHandler,
      cleanupConfigurations: cleanupKey ? JSON.parse(cleanupKey) : undefined,
    })
    let isStale = false
    createMultiSendCallOnlyTx(txs, scope)
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
  }, [safeAddress, guardAddress, fallbackHandler, cleanupKey, sdk, isAllowlistEnabled, setSafeTx, setSafeTxError])
}
