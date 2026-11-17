import type { ReactElement } from 'react'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import type { QueueStatus } from './types'

const STATUS_TONES: Record<QueueStatus, 'success' | 'warning'> = {
  execute: 'success',
  sign: 'success',
  waiting: 'warning',
  blocked: 'warning',
}

const getStatusLabel = (status: QueueStatus, nextNonce: number | undefined): string => {
  if (status === 'execute') return 'Execute'
  if (status === 'sign') return 'Sign'
  if (status === 'waiting') return 'Waiting'
  return nextNonce === undefined ? 'Blocked' : `Blocked by #${nextNonce}`
}

const StatusChip = ({ status, nextNonce }: { status: QueueStatus; nextNonce?: number }): ReactElement => (
  <Badge variant={STATUS_TONES[status]} size="status" shape="status">
    <BadgeDot />
    {getStatusLabel(status, nextNonce)}
  </Badge>
)

export default StatusChip
