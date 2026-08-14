import type { DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { DateLabel as SafeMessageDateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'

import { formatDate } from '@safe-global/utils/utils/date'

import css from './styles.module.css'

const TxDateLabel = ({ item }: { item: DateLabel | SafeMessageDateLabel }): ReactElement => {
  return (
    <div className={css.container}>
      <span>{formatDate(item.timestamp)}</span>
    </div>
  )
}

export default TxDateLabel
