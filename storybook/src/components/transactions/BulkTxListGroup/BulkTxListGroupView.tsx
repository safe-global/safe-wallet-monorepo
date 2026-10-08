import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import css from './styles.module.css'
import ExplorerButton from '@/components/common/ExplorerButton'
import { Layers } from 'lucide-react'
import { ICON_STROKE } from '@/components/common/iconStroke'

const orderClassTitles: Record<string, string> = {
  limit: 'Limit order settlement',
  twap: 'TWAP order settlement',
  liquidity: 'Liquidity order settlement',
  market: 'Swap order settlement',
}

export type BulkTxListGroupViewProps = {
  orderClass?: string
  explorerLink?: string
  items: Array<{ id: string; item: ReactNode }>
}

export const BulkTxListGroupView = ({ orderClass, explorerLink, items }: BulkTxListGroupViewProps): ReactElement => {
  let title = 'Bulk transactions'
  if (orderClass !== undefined) {
    title = orderClassTitles[orderClass] || orderClassTitles['market']
  }
  return (
    <Card data-testid="grouped-items" size="none" className={css.container}>
      <div style={{ gridArea: 'icon' }}>
        <Layers className="size-4" strokeWidth={ICON_STROKE} />
      </div>
      <div style={{ gridArea: 'info' }}>
        <Typography className="truncate">{title}</Typography>
      </div>
      <div className={css.action}>{items.length} transactions</div>
      <div className={css.hash}>
        <ExplorerButton href={explorerLink} isCompact={false} />
      </div>

      <div style={{ gridArea: 'items' }} className={css.txItems}>
        {items.map(({ id, item }) => (
          <div key={id}>{item}</div>
        ))}
      </div>
    </Card>
  )
}
