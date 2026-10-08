import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const Disclaimer = () => (
  <Typography>
    <b>Conflicting transactions</b>. Executing one will automatically replace the others.{' '}
    <ExternalLink
      href={HelpCenterArticle.CONFLICTING_TRANSACTIONS}
      title="Why are transactions with the same nonce conflicting with each other?"
      noIcon
      className="hover:text-muted-foreground"
    >
      Why did this happen?
    </ExternalLink>
  </Typography>
)

export type GroupedTxListItemsViewProps = {
  nonce?: number
  items: Array<{ id: string; item: ReactNode }>
  replacedTxIds: string[]
}

export const GroupedTxListItemsView = ({ nonce, items, replacedTxIds }: GroupedTxListItemsViewProps): ReactElement => {
  return (
    <div className={css.container}>
      <Typography style={{ gridArea: 'nonce' }}>{nonce}</Typography>
      <div className={css.disclaimerContainer} style={{ gridArea: 'warning' }}>
        <Disclaimer />
      </div>
      <div className={css.line} style={{ gridArea: 'line' }} />
      <div className={css.txItems} style={{ gridArea: 'items' }}>
        {items.map(({ id, item }) => (
          <div key={id} className={replacedTxIds.includes(id) ? css.willBeReplaced : undefined}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
