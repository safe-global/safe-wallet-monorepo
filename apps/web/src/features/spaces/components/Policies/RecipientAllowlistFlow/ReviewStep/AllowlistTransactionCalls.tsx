import { useCallback, useMemo, type ReactElement } from 'react'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature, type PolicyConfiguration } from '@/features/policy-guard'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import AllowlistSetupActions from './AllowlistSetupActions'

type AllowlistTransactionCallsProps = {
  safeTx?: SafeTransaction
  /** What CGW stored for a request, whose calldata carries only their root. */
  requestedConfigurations?: PolicyConfiguration[]
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
  const { describeSetupCall, decodeErc20TransferPolicyData, getCallConfigurations } = useLoadFeature(PolicyGuardFeature)
  const chainId = useSafeScope()?.chainId
  const { options: tokens } = useSpendingLimitTokenOptions()
  const resolveName = useSafeNameResolver()

  const calls = useMemo(() => (safeTx ? toCalls(safeTx.data) : undefined), [safeTx])
  const configurations = useMemo(
    () =>
      calls && getCallConfigurations
        ? (calls.map((call) => getCallConfigurations(call, requestedConfigurations)).find(Boolean) ?? [])
        : undefined,
    [calls, getCallConfigurations, requestedConfigurations],
  )

  const getAddressInfo = useCallback(
    (address: string) => {
      const token = tokens.find((option) => sameAddress(option.address, address))
      if (token) return { name: token.symbol, logoUri: token.logoUri }
      return { name: resolveName(address, chainId) || undefined }
    },
    [tokens, resolveName, chainId],
  )

  if (!calls || !configurations || !describeSetupCall || !decodeErc20TransferPolicyData) return null

  return (
    <AllowlistSetupActions
      calls={calls}
      configurations={configurations}
      describeCall={describeSetupCall}
      decodeRecipients={decodeErc20TransferPolicyData}
      getAddressInfo={getAddressInfo}
    />
  )
}

export default AllowlistTransactionCalls
