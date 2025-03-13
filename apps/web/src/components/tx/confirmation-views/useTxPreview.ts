import { Operation, getTxPreview } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import useAsync from '@/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'

const useTxPreview = (
  safeTxData?: {
    operation: SafeTransaction['data']['operation']
    data: SafeTransaction['data']['data']
    value: SafeTransaction['data']['value']
    to: SafeTransaction['data']['to']
  },
  customSafeAddress?: string,
  txId?: string,
) => {
  const skip = !!txId || !safeTxData
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const address = customSafeAddress ?? safeAddress
  const { operation = Operation.CALL, data = '', to, value } = safeTxData ?? {}

  return useAsync(() => {
    if (skip) return
    return getTxPreview(chainId, address, operation, data, to, value)
  }, [skip, chainId, address, operation, data, to, value])
}

export default useTxPreview
