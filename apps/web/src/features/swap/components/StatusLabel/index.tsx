import type { OrderStatuses } from '@safe-global/store/gateway/types'
import { SvgIcon } from '@mui/material'
import type { ReactElement } from 'react'
import CheckIcon from '@/public/images/common/circle-check.svg'
import ClockIcon from '@/public/images/common/clock.svg'
import BlockIcon from '@/public/images/common/block.svg'
import SignatureIcon from '@/public/images/common/document_signature.svg'
import CircleIPartialFillcon from '@/public/images/common/circle-partial-fill.svg'
import TxStatusChip, { type TxStatusChipProps } from '@/components/transactions/TxStatusChip'

type CustomOrderStatuses = OrderStatuses | 'partiallyFilled'
type Props = {
  status: CustomOrderStatuses
}

type StatusProps = {
  label: string
  color: TxStatusChipProps['color']
  icon: React.ComponentType
}

const statusMap: Record<CustomOrderStatuses, StatusProps> = {
  presignaturePending: {
    label: 'Execution needed',
    color: 'warning',
    icon: SignatureIcon,
  },
  fulfilled: {
    label: 'Filled',
    color: 'success',
    icon: CheckIcon,
  },
  open: {
    label: 'Open',
    color: 'warning',
    icon: ClockIcon,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: BlockIcon,
  },
  expired: {
    label: 'Expired',
    color: 'primary',
    icon: ClockIcon,
  },
  partiallyFilled: {
    label: 'Partially filled',
    color: 'success',
    icon: CircleIPartialFillcon,
  },
  // CGW claims it can return unknown status, but in reality I've never seen it
  unknown: {
    label: 'Unknown',
    color: 'error',
    icon: BlockIcon,
  },
}
const StatusLabel = (props: Props): ReactElement => {
  const { status } = props
  const { label, color, icon } = statusMap[status]

  return (
    <TxStatusChip color={color}>
      <SvgIcon component={icon} inheritViewBox fontSize="small" />
      {label}
    </TxStatusChip>
  )
}

export default StatusLabel
