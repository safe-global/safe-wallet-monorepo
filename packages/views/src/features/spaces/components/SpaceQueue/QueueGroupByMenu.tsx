import type { ReactElement } from 'react'
import GroupByMenu, { type GroupByOption } from '@safe-global/views/features/spaces/components/SpaceQueue/GroupByMenu'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'

const OPTIONS: GroupByOption<QueueGroupBy>[] = [
  { value: 'status', label: 'Urgency', hint: 'Transactions listed by order of urgency' },
  { value: 'next', label: 'Up next', hint: 'Next transaction on each Safe' },
  { value: 'safe', label: 'Safe', hint: 'Grouped by Safe, network and nonce order' },
  { value: 'network', label: 'Network', hint: 'Grouped by network' },
]

export type QueueGroupByMenuProps = {
  value: QueueGroupBy
  onChange: (value: QueueGroupBy) => void
}

const QueueGroupByMenu = (props: QueueGroupByMenuProps): ReactElement => <GroupByMenu options={OPTIONS} {...props} />

export default QueueGroupByMenu
