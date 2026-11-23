import { useContext, useEffect, useState } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { CreatePolicyConfigurationRequestDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { buildAllowlistRemovalConfigurations } from '@/features/policy-guard/public/services/allowlistConfigurations'
import {
  createRequestConfigurationTx,
  getConfigurationRoot,
} from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHasFeature } from '@/hooks/useChains'
import { createTx } from '@/services/tx/tx-sender/create'
import type { AllowlistRule } from '../RecipientAllowlistFlow/types'

/** Sets the `requestConfiguration` of the removal, and returns what CGW must store to apply it later. */
export const useBuildRemoveAllowlistTransaction = (
  guardAddress: string,
  rules: AllowlistRule[],
): CreatePolicyConfigurationRequestDto | undefined => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const [request, setRequest] = useState<CreatePolicyConfigurationRequestDto>()
  const sdk = scope?.sdk
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress
  // Keyed by value so an equal but re-created array does not rebuild the transaction.
  const rulesKey = JSON.stringify(rules)

  useEffect(() => {
    setRequest(undefined)
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!isAllowlistEnabled || !sdk || !chainId || !safeAddress) return

    let configurations: CreatePolicyConfigurationRequestDto['configurations']
    try {
      configurations = buildAllowlistRemovalConfigurations({
        chainId,
        safeAddress,
        rules: JSON.parse(rulesKey),
      })
    } catch (e) {
      setSafeTxError(asError(e))
      return
    }
    const root = getConfigurationRoot(configurations)

    let isStale = false
    createTx(createRequestConfigurationTx(guardAddress, root), undefined, scope)
      .then((tx) => {
        if (isStale) return
        setSafeTx(tx)
        setRequest({ root, configurations })
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(asError(e))
      })
    return () => {
      isStale = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `scope` is a new object on every Safe poll
  }, [guardAddress, rulesKey, sdk, chainId, safeAddress, isAllowlistEnabled, setSafeTx, setSafeTxError])

  return request
}
