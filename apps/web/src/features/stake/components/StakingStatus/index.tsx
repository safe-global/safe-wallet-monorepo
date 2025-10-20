import { NativeStakingStatus } from '@safe-global/store/gateway/types'
import { SvgIcon } from '@mui/material'
import CheckIcon from '@/public/images/common/circle-check.svg'
import ClockIcon from '@/public/images/common/clock.svg'
import SlashShield from '@/public/images/common/shield-off.svg'
import SignatureIcon from '@/public/images/common/document_signature.svg'
import TxStatusChip, { type TxStatusChipProps } from '@/components/transactions/TxStatusChip'
import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const ColorIcons: Record<
  NativeStakingStatus,
  | {
      color: TxStatusChipProps['color']
      icon?: React.ComponentType
      text: string
    }
  | undefined
> = {
  [NativeStakingStatus.NOT_STAKED]: {
    color: 'warning',
    icon: SignatureIcon,
    text: 'Inactive',
  },
  [NativeStakingStatus.ACTIVATING]: {
    color: 'info',
    icon: ClockIcon,
    text: 'Activating',
  },
  [NativeStakingStatus.DEPOSIT_IN_PROGRESS]: {
    color: 'info',
    icon: ClockIcon,
    text: 'Awaiting entry',
  },
  [NativeStakingStatus.ACTIVE]: {
    color: 'success',
    icon: CheckIcon,
    text: 'Validating',
  },
  [NativeStakingStatus.EXIT_REQUESTED]: {
    color: 'info',
    icon: ClockIcon,
    text: 'Requested exit',
  },
  [NativeStakingStatus.EXITING]: {
    color: 'info',
    icon: ClockIcon,
    text: 'Request pending',
  },
  [NativeStakingStatus.EXITED]: {
    color: 'success',
    icon: CheckIcon,
    text: 'Withdrawn',
  },
  [NativeStakingStatus.SLASHED]: {
    color: 'warning',
    icon: SlashShield,
    text: 'Slashed',
  },
}

const capitalizedStatus = (status: string) =>
  status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/g, (l) => l.toUpperCase())

const StakingStatus = ({ status }: { status: NativeStakingValidatorsExitTransactionInfo['status'] }) => {
  const config = ColorIcons[status]

  return (
    <TxStatusChip color={config?.color}>
      {config?.icon && <SvgIcon component={config.icon} fontSize="small" inheritViewBox />}
      {config?.text || capitalizedStatus(status)}
    </TxStatusChip>
  )
}

export default StakingStatus
