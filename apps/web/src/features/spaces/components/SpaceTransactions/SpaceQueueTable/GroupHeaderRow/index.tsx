import type { ComponentProps, ReactElement } from 'react'
import { QueueGroupRow, UP_NEXT_GROUP_LABELS } from '@safe-global/views/features/spaces/components/SpaceQueue'
import { useChain } from '@/hooks/useChains'
import { QUEUE_COLUMNS } from '../../SpaceQueueRow'
import type { QueueGroupKind } from '../queueGroups'

const GroupHeaderRow = ({
  group,
  chainId,
  count,
  collapsed,
  onToggle,
  rowProps,
}: {
  group: Exclude<QueueGroupKind, 'all'>
  chainId?: string
  count: number
  collapsed: boolean
  onToggle: () => void
  rowProps?: ComponentProps<'tr'>
}): ReactElement => {
  const chain = useChain(chainId ?? '')
  const isNetwork = group === 'network'
  return (
    <QueueGroupRow
      label={isNetwork ? (chain?.chainName ?? chainId ?? '') : UP_NEXT_GROUP_LABELS[group]}
      logoUri={isNetwork ? (chain?.chainLogoUri ?? undefined) : undefined}
      count={count}
      collapsed={collapsed}
      colSpan={QUEUE_COLUMNS.length - 1}
      onToggle={onToggle}
      rowProps={rowProps}
    />
  )
}

export default GroupHeaderRow
