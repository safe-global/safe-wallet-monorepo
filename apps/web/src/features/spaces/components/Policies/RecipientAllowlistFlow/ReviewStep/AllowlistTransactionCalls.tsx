import { useCallback, useMemo, type ReactElement } from 'react'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { decodeErc20TransferPolicyData } from '@/features/policy-guard/public/services/allowlistConfigurations'
import { describeSetupCall, getCallConfigurations } from '@/features/policy-guard/public/services/policyGuardEncoders'
import { useHasFeature } from '@/hooks/useChains'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { useAllowlistAddressInfo } from '../hooks/useAllowlistAddressInfo'
import AllowlistSetupActions from './AllowlistSetupActions'

type AllowlistTransactionCallsProps = {
  safeTx?: SafeTransaction
  /** What CGW stored for each request, whose calldata carries only its root. */
  requestedConfigurations?: PolicyConfiguration[][]
}

const toCalls = ({ to, value, data, operation }: SafeTransaction['data']): MetaTransactionData[] => {
  const call = { to, value, data, operation }
  if (!isMultiSendCalldata(data)) return [call]
  try {
    return decodeMultiSendData(data)
  } catch {
    return [call]
  }
}

/** The create review's rule-by-rule calls, for a transaction built elsewhere: an apply, or a queued setup. */
const AllowlistTransactionCalls = ({
  safeTx,
  requestedConfigurations,
}: AllowlistTransactionCallsProps): ReactElement | null => {
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
  const getAddressInfo = useAllowlistAddressInfo()
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  const calls = useMemo(() => (safeTx ? toCalls(safeTx.data) : undefined), [safeTx])
  const getConfigurations = useCallback(
    (call: MetaTransactionData) =>
      requestedConfigurations?.map((requested) => getCallConfigurations(call, requested)).find(Boolean) ??
      getCallConfigurations(call),
    [requestedConfigurations],
  )

  if (!chainId || !safeAddress || !calls || !isAllowlistEnabled) return null

  return (
    <AllowlistSetupActions
      chainId={chainId}
      safeAddress={safeAddress}
      calls={calls}
      getConfigurations={getConfigurations}
      describeCall={describeSetupCall}
      decodeRecipients={decodeErc20TransferPolicyData}
      getAddressInfo={getAddressInfo}
    />
  )
}

export default AllowlistTransactionCalls
