import type { ReactNode } from 'react'
import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Link } from '@/components/ui/link'
import FieldsGrid from '@/components/tx/FieldsGrid'
import StakingStatus from './StakingStatus'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'

export type BeaconChainLinkProps = { validator: string; name: string }

export type StakingTxExitDetailsViewProps = {
  info: NativeStakingValidatorsExitTransactionInfo
  renderBeaconChainLink: (props: BeaconChainLinkProps, key: number) => ReactNode
}

export const StakingTxExitDetailsView = ({ info, renderBeaconChainLink }: StakingTxExitDetailsViewProps) => {
  const withdrawIn = formatDurationFromMilliseconds(info.estimatedExitTime + info.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return (
    <div className="flex flex-col gap-2 pr-10">
      <FieldsGrid title="Exit">
        {info.validators.map((validator: string, index: number) => {
          return (
            <>
              {renderBeaconChainLink({ name: `Validator ${index + 1}`, validator }, index)}
              {index < info.validators.length - 1 && ' | '}
            </>
          )
        })}
      </FieldsGrid>
      {info.status !== 'EXITED' && <FieldsGrid title="Est. exit time">Up to {withdrawIn}</FieldsGrid>}

      <FieldsGrid title="Validator status">
        <StakingStatus status={info.status} />
      </FieldsGrid>
    </div>
  )
}

export type BeaconChainLinkViewProps = {
  href: string
  name: string
}

export const BeaconChainLinkView = ({ href, name }: BeaconChainLinkViewProps) => {
  return (
    <Link target="_blank" rel="noreferrer noopener" href={href}>
      {name}
    </Link>
  )
}
