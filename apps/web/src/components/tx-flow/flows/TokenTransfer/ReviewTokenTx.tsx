import { useContext, type ReactElement, type PropsWithChildren } from 'react'
import type { MultiTokenTransferParams } from '@safe-global/views/components/tx-flow/flows/TokenTransfer/types'
import { TokenTransferType } from '@safe-global/views/components/tx-flow/flows/TokenTransfer/types'
import ReviewTokenTransfer from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTransfer'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import ReviewSpendingLimitTx from '@/features/spending-limits/public/components/ReviewSpendingLimitTx'

const ReviewTokenTx = (props: PropsWithChildren<{ onSubmit: () => void; txNonce?: number }>): ReactElement => {
  const { data } = useContext(TxFlowContext) as TxFlowContextType<MultiTokenTransferParams>
  const isSpendingLimitTx = data?.type === TokenTransferType.spendingLimit

  return isSpendingLimitTx && data?.recipients.length === 1 ? (
    // TODO: Allow batched spending limit txs
    <ReviewSpendingLimitTx params={data.recipients[0]} onSubmit={props.onSubmit} />
  ) : (
    <ReviewTokenTransfer params={data} {...props} />
  )
}

export default ReviewTokenTx
