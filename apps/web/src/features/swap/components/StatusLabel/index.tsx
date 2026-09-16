import type { OrderStatuses } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'
import { Ban, CircleCheck, CircleX, Clock, Contrast, FileSignature, type LucideIcon } from 'lucide-react'
import TxStatusChip, { type TxStatusChipProps } from '@/components/transactions/TxStatusChip'

type CustomOrderStatuses = OrderStatuses | 'partiallyFilled'
type Props = {
  status: CustomOrderStatuses
}

type StatusProps = {
  label: string
  color: TxStatusChipProps['color']
  icon: LucideIcon
}

const statusMap: Record<CustomOrderStatuses, StatusProps> = {
  presignaturePending: {
    label: 'Execution needed',
    color: 'warning',
    icon: FileSignature,
  },
  fulfilled: {
    label: 'Filled',
    color: 'success',
    icon: CircleCheck,
  },
  open: {
    label: 'Open',
    color: 'warning',
    icon: Clock,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: Ban,
  },
  expired: {
    label: 'Expired',
    color: 'primary',
    icon: Clock,
  },
  partiallyFilled: {
    label: 'Partially filled',
    color: 'success',
    icon: Contrast,
  },
  // CGW claims it can return unknown status, but in reality I've never seen it
  unknown: {
    label: 'Unknown',
    color: 'error',
    icon: CircleX,
  },
}
const StatusLabel = (props: Props): ReactElement => {
  const { status } = props
  const { label, color, icon: Icon } = statusMap[status]

  return (
    <TxStatusChip color={color}>
      <Icon />
      {label}
    </TxStatusChip>
  )
}

export default StatusLabel
