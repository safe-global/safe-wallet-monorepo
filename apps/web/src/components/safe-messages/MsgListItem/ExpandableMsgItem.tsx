import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import MsgDetails from '@/components/safe-messages/MsgDetails'
import MsgSummary from '@/components/safe-messages/MsgSummary'
import { ExpandableMsgItemView } from '@views/components/safe-messages/MsgListItem/ExpandableMsgItemView'

const ExpandableMsgItem = ({ msg, expanded = false }: { msg: MessageItem; expanded?: boolean }): ReactElement => {
  return (
    <ExpandableMsgItemView
      expanded={expanded}
      summary={<MsgSummary msg={msg} />}
      details={<MsgDetails msg={msg} />}
      renderErrorBoundary={(props) => <ObservabilityErrorBoundary {...props} />}
    />
  )
}

export default ExpandableMsgItem
