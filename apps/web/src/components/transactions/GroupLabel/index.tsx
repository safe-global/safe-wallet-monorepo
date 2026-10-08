import { LabelValue } from '@safe-global/store/gateway/types'
import type { LabelQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { GroupLabelView } from '@views/components/transactions/GroupLabel/GroupLabelView'

const GroupLabel = ({ item }: { item: LabelQueuedItem }): ReactElement => {
  const { safe } = useSafeInfo()

  return <GroupLabelView label={item.label} isQueued={item.label === LabelValue.Queued} nonce={safe.nonce} />
}

export default GroupLabel
