import { type ReactElement } from 'react'
import { type MultiTokenTransferParams, TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer/index'
import ReviewTokenTransfer from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTransfer'
import ReviewSpendingLimitTx from '@/components/tx-flow/flows/TokenTransfer/ReviewSpendingLimitTx'

const ReviewTokenTx = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: MultiTokenTransferParams
  onSubmit: () => void
  txNonce?: number
}): ReactElement => {
  const isSpendingLimitTx = params.type === TokenTransferType.spendingLimit

  return isSpendingLimitTx && params.recipients.length === 1 ? (
    // TODO: Allow batched spending limit txs
    <ReviewSpendingLimitTx params={params.recipients[0]} onSubmit={onSubmit} />
  ) : (
    <ReviewTokenTransfer params={params} onSubmit={onSubmit} txNonce={txNonce} />
  )
}

export default ReviewTokenTx
