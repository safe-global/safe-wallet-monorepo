import { useContext, useEffect, useState } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { CreatePolicyConfigurationRequestDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { buildAllowlistRemovalConfigurations } from '@/features/policy-guard/public/services/allowlistConfigurations'
import { getConfigurationLimitError } from '@/features/policy-guard/public/services/allowlistLimits'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import {
  createRequestConfigurationTx,
  getConfigurationRoot,
} from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHasFeature } from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import type { AllowlistRule } from '../RecipientAllowlistFlow/types'

/**
 * Sets the batch that requests both roots of the removal: the deletion of the rules, then the clean-up that the guard
 * removal applies. Returns what CGW must store to apply them later.
 */
export const useBuildRemoveAllowlistTransaction = (
  guardAddress: string,
  rules: AllowlistRule[],
): CreatePolicyConfigurationRequestDto[] | undefined => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const [requests, setRequests] = useState<CreatePolicyConfigurationRequestDto[]>()
  const sdk = scope?.sdk
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress
  // Keyed by value so an equal but re-created array does not rebuild the transaction.
  const rulesKey = JSON.stringify(rules)

  useEffect(() => {
    setRequests(undefined)
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!isAllowlistEnabled || !sdk || !chainId || !safeAddress) return

    let roots: CreatePolicyConfigurationRequestDto[]
    try {
      roots = [
        buildAllowlistRemovalConfigurations({ chainId, safeAddress, rules: JSON.parse(rulesKey) }),
        buildGuardRemovalCleanupConfigurations(chainId, safeAddress),
      ].map((configurations) => ({ configurations, root: getConfigurationRoot(configurations) }))
    } catch (e) {
      setSafeTxError(asError(e))
      return
    }
    const limitError = roots.map(({ configurations }) => getConfigurationLimitError(configurations)).find(Boolean)
    if (limitError) {
      setSafeTxError(new Error(limitError))
      return
    }

    let isStale = false
    createMultiSendCallOnlyTx(
      roots.map(({ root }) => createRequestConfigurationTx(guardAddress, root)),
      scope,
    )
      .then((tx) => {
        if (isStale) return
        setSafeTx(tx)
        setRequests(roots)
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(asError(e))
      })
    return () => {
      isStale = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `scope` is a new object on every Safe poll
  }, [guardAddress, rulesKey, sdk, chainId, safeAddress, isAllowlistEnabled, setSafeTx, setSafeTxError])

  return requests
}
