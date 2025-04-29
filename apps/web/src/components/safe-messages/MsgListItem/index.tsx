import type { SafeMessageListItem } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'

import { isSafeMessageListDateLabel, isSafeMessageListItem } from '@/utils/safe-message-guards'
import TxDateLabel from '@/components/transactions/TxDateLabel'
import ExpandableMsgItem from '@/components/safe-messages/MsgListItem/ExpandableMsgItem'

const MsgListItem = ({ item }: { item: SafeMessageListItem }): ReactElement | null => {
  if (isSafeMessageListDateLabel(item)) {
    return <TxDateLabel item={item} />
  }
  if (isSafeMessageListItem(item)) {
    return <ExpandableMsgItem msg={item} />
  }
  return null
}

export default MsgListItem
