import { type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import type { MultiTokenTransferParams } from '.'
import { SafeTxContext } from '../../SafeTxProvider'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { Divider, Stack } from '@mui/material'
import ReviewRecipientRow from './ReviewRecipientRow'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

const ReviewTokenTransfer = ({
  params,
  onSubmit,
  txNonce,
  children,
}: PropsWithChildren<{
  params?: MultiTokenTransferParams
  onSubmit: () => void
  txNonce?: number
}>) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const [balances] = useTrustedTokenBalances()

  const recipients = useMemo(() => params?.recipients || [], [params?.recipients])

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }

    if (!balances) return

    const calls = recipients
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
  }, [recipients, txNonce, setNonce, balances, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      {recipients.length > 1 && (
        <Stack divider={<Divider />} gap={2}>
          {recipients.map((recipient, index) => (
            <ReviewRecipientRow
              params={recipient}
              key={`${recipient.recipient}_${index}`}
              name={`Recipient ${index + 1}`}
            />
          ))}
        </Stack>
      )}

      {recipients.length > 1 && <Divider />}

      {children}
    </ReviewTransaction>
  )
}

export default ReviewTokenTransfer
