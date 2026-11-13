import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { isMultisigExecutionInfo, isTransactionQueuedItem } from '@/utils/transaction-guards'
import uniqBy from 'lodash/uniqBy'
import useTxQueue from '@/hooks/useTxQueue'

export const _getUniqueQueuedTxs = (page?: QueuedItemPage) => {
  if (!page) {
    return []
  }

  const txs = page.results.filter(isTransactionQueuedItem).map((item) => item.transaction)

  return uniqBy(txs, (tx) => {
    return isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : ''
  })
}

export const getQueuedNonces = (page?: QueuedItemPage): number[] => {
  return _getUniqueQueuedTxs(page)
    .map((tx) => (isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined))
    .filter((nonce): nonce is number => nonce !== undefined)
}

const usePreviousNonces = () => {
  const { page } = useTxQueue()

  return useMemo(() => getQueuedNonces(page), [page])
}

export default usePreviousNonces
