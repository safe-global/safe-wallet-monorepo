import type {
  QueuedItemPage,
  Transaction,
  TransactionItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/** The transactions of a queue or history page, without its labels, date labels and conflict headers. */
export function transactionsIn(page: QueuedItemPage | TransactionItemPage): Transaction[] {
  return page.results.flatMap((item) => (item.type === 'TRANSACTION' ? [item.transaction] : []))
}

/** The Safe nonce of a multisig transaction; undefined for module transactions and incoming transfers. */
export function nonceOf(transaction: Transaction): number | undefined {
  return transaction.executionInfo?.type === 'MULTISIG' ? transaction.executionInfo.nonce : undefined
}

/** The action count of each multisig transaction on the page; undefined for one that is not a multiSend. */
export function multiSendActionCounts(page: QueuedItemPage | TransactionItemPage): Array<number | undefined> {
  return transactionsIn(page)
    .filter((transaction) => nonceOf(transaction) !== undefined)
    .map(({ txInfo }) => ('actionCount' in txInfo ? txInfo.actionCount : undefined))
}

/** The ERC-20 transfers on a history page, as CGW maps them. */
export function erc20TransfersIn(
  page: TransactionItemPage,
): Array<{ tokenAddress: string; value: string; direction: string }> {
  return transactionsIn(page).flatMap(({ txInfo }) =>
    txInfo.type === 'Transfer' && txInfo.transferInfo.type === 'ERC20'
      ? [
          {
            tokenAddress: txInfo.transferInfo.tokenAddress,
            value: txInfo.transferInfo.value,
            direction: txInfo.direction,
          },
        ]
      : [],
  )
}
