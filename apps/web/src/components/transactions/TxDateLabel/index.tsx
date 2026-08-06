import type { DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { DateLabel as SafeMessageDateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'

import { formatDate } from '@safe-global/utils/utils/date'

const TxDateLabel = ({ item }: { item: DateLabel | SafeMessageDateLabel }): ReactElement => {
  return (
    <div className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      <span>{formatDate(item.timestamp)}</span>
    </div>
  )
}

export default TxDateLabel
