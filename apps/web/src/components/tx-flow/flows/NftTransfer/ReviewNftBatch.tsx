import { type ReactElement, useEffect, useContext } from 'react'
import SendToBlock from '@/components/tx/SendToBlock'
import { createNftTransferParams } from '@/services/tx/tokenTransferParams'
import type { NftTransferParams } from '.'
import useSafeAddress from '@/hooks/useSafeAddress'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { NftItems } from '@/components/tx-flow/flows/NftTransfer/SendNftBatch'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

const ReviewNftBatch = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<NftTransferParams>>(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const safeAddress = useSafeAddress()
  const { tokens = [] } = data || {}

  useEffect(() => {
    if (!safeAddress || !data) return

    const calls = tokens.map((token) => {
      return createNftTransferParams(safeAddress, data.recipient, token.id, token.address)
    })

    const promise = calls.length > 1 ? createMultiSendCallOnlyTx(calls) : createTx(calls[0])

    promise.then(setSafeTx).catch(setSafeTxError)
  }, [safeAddress, tokens, data, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <SendToBlock address={data?.recipient || ''} />

      <FieldsGrid title={`NFT${maybePlural(tokens)}`}>
        <NftItems tokens={tokens} />
      </FieldsGrid>

      {children}
    </ReviewTransaction>
  )
}

export default ReviewNftBatch
