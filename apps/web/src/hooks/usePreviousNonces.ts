import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { isMultisigExecutionInfo, isTransactionListItem } from '@/utils/transaction-guards'
import uniqBy from 'lodash/uniqBy'
import useTxQueue from '@/hooks/useTxQueue'

export const _getUniqueQueuedTxs = (page?: QueuedItemPage) => {
  if (!page) {
    return []
  }

  const txs = page.results.filter(isTransactionListItem).map((item) => item.transaction)

  return uniqBy(txs, (tx) => {
    return isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : ''
  })
}

const usePreviousNonces = () => {
  const { page } = useTxQueue()

  const previousNonces = useMemo(() => {
    return _getUniqueQueuedTxs(page)
      .map((tx) => (isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined))
      .filter((nonce): nonce is number => nonce !== undefined)
  }, [page])

  return previousNonces
}

export default usePreviousNonces
