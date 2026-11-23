import { type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { createMultiTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import type { MultiTokenTransferParams } from '@safe-global/views/components/tx-flow/flows/TokenTransfer/types'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { Fragment } from 'react'
import { Separator } from '@safe-global/views/components/ui/separator'
import ReviewRecipientRow from './ReviewRecipientRow'
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

    createMultiSendCallOnlyTx(createMultiTokenTransferParams(recipients, balances.items), scope)
      .then(setSafeTx)
      .catch(setSafeTxError)
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
