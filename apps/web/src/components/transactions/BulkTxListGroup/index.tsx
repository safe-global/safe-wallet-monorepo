import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { AnyTransactionItem } from '@/utils/tx-list'
import type { ReactElement } from 'react'
import { isSwapTransferOrderTxInfo } from '@/utils/transaction-guards'
import { Typography } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import css from './styles.module.css'
import ExplorerButton from '@/components/common/ExplorerButton'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { getOrderClass } from '@/features/swap'
import { Layers } from 'lucide-react'
import { ICON_STROKE } from '@/components/common/iconStroke'

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
    <Card data-testid="grouped-items" size="none" className={css.container}>
      <div style={{ gridArea: 'icon' }}>
        <Layers className="size-4" strokeWidth={ICON_STROKE} />
      </div>
      <div style={{ gridArea: 'info' }}>
        <Typography className="truncate">{title}</Typography>
      </div>
      <div className={css.action}>{groupedListItems.length} transactions</div>
      <div className={css.hash}>
        <ExplorerButton href={explorerLink} isCompact={false} />
      </div>

      <div style={{ gridArea: 'items' }} className={css.txItems}>
        {groupedListItems.map((tx) => (
          <div key={tx.transaction.id}>
            <ExpandableTransactionItem item={tx} isBulkGroup={true} />
          </div>
        ))}
      </div>
    </Card>
  )
}

export default GroupedTxListItems
