import { useContext, type ReactElement, type PropsWithChildren } from 'react'
import { type MultiTokenTransferParams, TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer/index'
import ReviewTokenTransfer from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTransfer'
import ReviewSpendingLimitTx from '@/components/tx-flow/flows/TokenTransfer/ReviewSpendingLimitTx'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

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
