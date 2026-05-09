import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'

import { TxListGrid } from '@/components/transactions/TxList'
import MsgListItem from '@/components/safe-messages/MsgListItem'

const MsgList = ({ items }: { items: MessagePage['results'] }): ReactElement => {
  return (
    <TxListGrid>
      {items.map((item, i) => (
        <MsgListItem item={item} key={i} />
      ))}
    </TxListGrid>
  )
}

export default MsgList
