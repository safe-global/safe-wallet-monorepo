import type { SvgrComponent } from '@/components/common/icons/types'
import CheckIcon from '@/public/images/common/circle-check.svg'
import ClockIcon from '@/public/images/common/clock.svg'
import SlashShield from '@/public/images/common/shield-off.svg'
import SignatureIcon from '@/public/images/common/document_signature.svg'
import TxStatusChip, { type TxStatusChipProps } from '@/components/transactions/TxStatusChip'
import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const ColorIcons: Record<
  NativeStakingValidatorsExitTransactionInfo['status'],
  | {
      color: TxStatusChipProps['color']
      icon?: SvgrComponent
      text: string
    }
  | undefined
> = {
  NOT_STAKED: {
    color: 'warning',
    icon: SignatureIcon,
    text: 'Inactive',
  },
  ACTIVATING: {
    color: 'info',
    icon: ClockIcon,
    text: 'Activating',
  },
  DEPOSIT_IN_PROGRESS: {
    color: 'info',
    icon: ClockIcon,
    text: 'Awaiting entry',
  },
  ACTIVE: {
    color: 'success',
    icon: CheckIcon,
    text: 'Validating',
  },
  EXIT_REQUESTED: {
    color: 'info',
    icon: ClockIcon,
    text: 'Requested exit',
  },
  EXITING: {
    color: 'info',
    icon: ClockIcon,
    text: 'Request pending',
  },
  EXITED: {
    color: 'success',
    icon: CheckIcon,
    text: 'Withdrawn',
  },
  SLASHED: {
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
      {config?.icon && <config.icon />}
      {config?.text || capitalizedStatus(status)}
    </TxStatusChip>
  )
}

export default StakingStatus
