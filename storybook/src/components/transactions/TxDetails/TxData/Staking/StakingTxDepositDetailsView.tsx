import type { ReactNode } from 'react'
import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import FieldsGrid from '@/components/tx/FieldsGrid'

export type StakingTxDepositDetailsViewProps = {
  info: NativeStakingDepositTransactionInfo
  hasTxData: boolean
  renderSendAmountBlock: (props: { title: string }) => ReactNode
  confirmation: ReactNode
}

export const StakingTxDepositDetailsView = ({
  info,
  hasTxData,
  renderSendAmountBlock,
  confirmation,
}: StakingTxDepositDetailsViewProps) => {
  return (
    <div className="flex flex-col gap-2 pl-2 pr-10">
      {hasTxData && renderSendAmountBlock({ title: 'Deposit' })}
      <FieldsGrid title="Net reward rate">{info.annualNrr.toFixed(3)}%</FieldsGrid>
      {confirmation}
    </div>
  )
}
