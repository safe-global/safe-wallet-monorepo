import { useContext, useEffect } from 'react'
import useBalances from '@/hooks/useBalances'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import type { MultiTokenTransferParams } from '.'
import { SafeTxContext } from '../../SafeTxProvider'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { Divider, Stack } from '@mui/material'
import ReviewRecipientRow from './ReviewRecipientRow'
import { sameAddress } from '@/utils/addresses'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

const ReviewTokenTransfer = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: MultiTokenTransferParams
  onSubmit: () => void
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
        const token = balances.items.find((item) => sameAddress(item.tokenInfo.address, recipient.tokenAddress))

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
    <ReviewTransaction onSubmit={onSubmit}>
      <Stack divider={<Divider />} gap={2}>
        {params.recipients.map((recipient, index) => (
          <ReviewRecipientRow
            params={recipient}
            key={`${recipient.recipient}_${index}`}
            name={`Recipient ${index + 1}`}
          />
        ))}
      </Stack>
    </ReviewTransaction>
  )
}

export default ReviewTokenTransfer
