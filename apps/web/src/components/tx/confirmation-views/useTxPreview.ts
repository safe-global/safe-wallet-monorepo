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
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const address = customSafeAddress ?? safeAddress

  return useAsync(() => {
    if (txId || !safeTxData?.data) return
    const { operation = Operation.CALL, data = '', to, value } = safeTxData || {}
    return getTxPreview(chainId, address, operation, data, to, value)
  }, [txId, chainId, address, safeTxData])
}

export default useTxPreview
