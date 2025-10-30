import { useTransactionsPreviewTransactionV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect } from 'react'

const useTxPreview = (
  safeTxData?: {
    operation: SafeTransaction['data']['operation']
    data: SafeTransaction['data']['data']
    value: SafeTransaction['data']['value']
    to: SafeTransaction['data']['to']
  },
  customSafeAddress?: string,
  txId?: string,
): [TransactionPreview | undefined, Error | undefined, boolean] => {
  const skip = !!txId || !safeTxData
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const address = customSafeAddress ?? safeAddress
  const { operation = Operation.CALL, data = '', to, value } = safeTxData ?? {}

  const [triggerPreview, { data: txPreview, error, isLoading }] = useTransactionsPreviewTransactionV1Mutation()

  useEffect(() => {
    if (skip) return

    triggerPreview({
      chainId,
      safeAddress: address,
      previewTransactionDto: {
        to: to || '',
        data: data || null,
        value: value || '0',
        operation,
      },
    })
  }, [skip, chainId, address, operation, data, to, value, triggerPreview])

  return [txPreview, error as Error | undefined, isLoading]
}

export default useTxPreview
