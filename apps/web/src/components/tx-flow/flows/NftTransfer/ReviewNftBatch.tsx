import { type ReactElement, useEffect, useContext } from 'react'
import { Grid, Typography } from '@mui/material'
import SendToBlock from '@/components/tx/SendToBlock'
import { createNftTransferParams } from '@/services/tx/tokenTransferParams'
import type { NftTransferParams } from '.'
import useSafeAddress from '@/hooks/useSafeAddress'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { NftItems } from '@/components/tx-flow/flows/NftTransfer/SendNftBatch'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

type ReviewNftBatchProps = {
  params: NftTransferParams
  onSubmit: () => void
  txNonce?: number
}

const ReviewNftBatch = ({ params, onSubmit, txNonce }: ReviewNftBatchProps): ReactElement => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const safeAddress = useSafeAddress()
  const { tokens } = params

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [txNonce, setNonce])

  useEffect(() => {
    if (!safeAddress) return

    const calls = params.tokens.map((token) => {
      return createNftTransferParams(safeAddress, params.recipient, token.id, token.address)
    })

    const promise = calls.length > 1 ? createMultiSendCallOnlyTx(calls) : createTx(calls[0])

    promise.then(setSafeTx).catch(setSafeTxError)
  }, [safeAddress, params, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <Grid
        container
        sx={{
          gap: 1,
          mb: 2,
        }}
      >
        <Grid item md>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            Send
          </Typography>
        </Grid>

        <Grid item xs md={10}>
          <NftItems tokens={tokens} />
        </Grid>
      </Grid>
      <SendToBlock address={params.recipient} />
    </ReviewTransaction>
  )
}

export default ReviewNftBatch
