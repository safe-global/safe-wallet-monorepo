import type { MessageItem, DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeMessageListItem } from '@safe-global/store/gateway/types'

export const isSafeMessageListDateLabel = (item: SafeMessageListItem): item is DateLabel => {
  return item.type === 'DATE_LABEL'
}

export const isSafeMessageListItem = (item: SafeMessageListItem): item is MessageItem => {
  return item.type === 'MESSAGE'
}
