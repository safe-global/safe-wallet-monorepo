import { type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import type { MultiTokenTransferParams } from '.'
import { SafeTxContext } from '../../SafeTxProvider'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { Fragment } from 'react'
import { Separator } from '@safe-global/views/components/ui/separator'
import ReviewRecipientRow from './ReviewRecipientRow'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'

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
  const scope = useSafeScope()

  const recipients = useMemo(() => params?.recipients || [], [params?.recipients])

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }

    if (!balances) return
    if (scope && !scope.sdk) return

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

    createMultiSendCallOnlyTx(calls, scope).then(setSafeTx).catch(setSafeTxError)
  }, [recipients, txNonce, setNonce, balances, scope, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      {recipients.length > 1 && (
        <div className="flex flex-col gap-4">
          {recipients.map((recipient, index) => (
            <Fragment key={`${recipient.recipient}_${index}`}>
              {index > 0 && <Separator />}
              <ReviewRecipientRow params={recipient} name={`Recipient ${index + 1}`} />
            </Fragment>
          ))}
        </div>
      )}

      {recipients.length > 1 && <Separator />}

      {children}
    </ReviewTransaction>
  )
}

export default ReviewTokenTransfer
