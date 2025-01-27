import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import type { SubmitCallback } from '@/components/tx/SignOrExecuteForm/SignOrExecuteForm'
import useBalances from '@/hooks/useBalances'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { safeParseUnits } from '@/utils/formatters'
import { Divider, Grid } from '@mui/material'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { useContext, useEffect } from 'react'
import type { TokenTransfersParams } from '.'

const ReviewTokenTransfers = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: TokenTransfersParams
  onSubmit: SubmitCallback
  txNonce?: number
}) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const { balances } = useBalances()

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }

    const calls = params.recipients
      .map((recipient) => {
        const token = balances.items.find((item) => item.tokenInfo.address === recipient.tokenAddress)

        if (!token) return

        return createTokenTransferParams(
          recipient.recipient,
          recipient.amount,
          token?.tokenInfo.decimals,
          recipient.tokenAddress,
        )
      })
      .filter((transfer): transfer is MetaTransactionData => !!transfer)

    createMultiSendCallOnlyTx(calls).then(setSafeTx).catch(setSafeTxError)
  }, [params, txNonce, setNonce, balances, setSafeTx, setSafeTxError])

  return (
    <SignOrExecuteForm onSubmit={onSubmit}>
      {params.recipients.map((recipient, index) => {
        const token = balances.items.find((item) => item.tokenInfo.address === recipient.tokenAddress)
        const amountInWei = safeParseUnits(recipient.amount, token?.tokenInfo.decimals)?.toString() || '0'

        return (
          <>
            {index > 0 && <Divider sx={{ mb: 3 }} />}

            <Grid
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
              key={`${recipient.recipient}_${token?.tokenInfo.address}`}
            >
              {token && (
                <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} safenet tokenSize={32} />
              )}
              <SendToBlock address={recipient.recipient} name={`Recipient ${index + 1}`} avatarSize={32} />
            </Grid>
          </>
        )
      })}
    </SignOrExecuteForm>
  )
}

export default ReviewTokenTransfers
