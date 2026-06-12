import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { AnyTransactionItem } from '@/utils/tx-list'
import type { ReactElement } from 'react'
import { isMultisigExecutionInfo, isSwapTransferOrderTxInfo } from '@/utils/transaction-guards'
import { Typography } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import BatchIcon from '@/public/images/common/batch.svg'
import css from './styles.module.css'
import ExplorerButton from '@/components/common/ExplorerButton'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { getOrderClass } from '@/features/swap'

const orderClassTitles: Record<string, string> = {
  limit: 'Limit order settlement',
  twap: 'TWAP order settlement',
  liquidity: 'Liquidity order settlement',
  market: 'Swap order settlement',
}

const getSettlementOrderTitle = (order: OrderTransactionInfo): string => {
  const orderClass = getOrderClass(order)
  return orderClassTitles[orderClass] || orderClassTitles['market']
}

const GroupedTxListItems = ({
  groupedListItems,
  transactionHash,
}: {
  groupedListItems: AnyTransactionItem[]
  transactionHash: string
}): ReactElement | null => {
  const chain = useCurrentChain()
  const explorerLink = chain && getBlockExplorerLink(chain, transactionHash)?.href
  if (groupedListItems.length === 0) return null
  let title = 'Bulk transactions'
  const isSwapTransfer = isSwapTransferOrderTxInfo(groupedListItems[0].transaction.txInfo)
  if (isSwapTransfer) {
    title = getSettlementOrderTitle(groupedListItems[0].transaction.txInfo as OrderTransactionInfo)
  }
  return (
    <Card data-testid="grouped-items" className={cn(css.container, 'gap-0 border-0 py-2 shadow-none')}>
      <div style={{ gridArea: 'icon' }}>
        <BatchIcon className="size-6" />
      </div>
      <div style={{ gridArea: 'info' }}>
        <Typography className="truncate">{title}</Typography>
      </div>
      <div className={css.action}>{groupedListItems.length} transactions</div>
      <div className={css.hash}>
        <ExplorerButton href={explorerLink} isCompact={false} />
      </div>

      <div style={{ gridArea: 'items' }} className={css.txItems}>
        {groupedListItems.map((tx) => {
          const nonce = isMultisigExecutionInfo(tx.transaction.executionInfo) ? tx.transaction.executionInfo.nonce : ''
          return (
            <div className="relative" key={tx.transaction.id}>
              <div className={css.nonce}>
                <Typography className={css.nonce}>{nonce}</Typography>
              </div>
              <ExpandableTransactionItem item={tx} isBulkGroup={true} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default GroupedTxListItems
