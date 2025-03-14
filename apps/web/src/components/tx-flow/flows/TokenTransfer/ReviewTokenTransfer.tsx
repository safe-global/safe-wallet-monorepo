import { useContext, useEffect, useMemo } from 'react'
import useBalances from '@/hooks/useBalances'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createTx } from '@/services/tx/tx-sender'
import type { TokenTransferParams } from '.'
import { SafeTxContext } from '../../SafeTxProvider'
import { safeParseUnits } from '@/utils/formatters'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

const ReviewTokenTransfer = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: TokenTransferParams
  onSubmit: () => void
  txNonce?: number
}) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const { balances } = useBalances()
  const token = balances.items.find((item) => item.tokenInfo.address === params.tokenAddress)

  const amountInWei = useMemo(
    () => safeParseUnits(params.amount, token?.tokenInfo.decimals)?.toString() || '0',
    [params.amount, token?.tokenInfo.decimals],
  )

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }

    if (!token) return

    const txParams = createTokenTransferParams(
      params.recipient,
      params.amount,
      token.tokenInfo.decimals,
      token.tokenInfo.address,
    )

    createTx(txParams, txNonce).then(setSafeTx).catch(setSafeTxError)
  }, [params, txNonce, token, setNonce, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      {token && <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} />}

      <SendToBlock address={params.recipient} />
    </ReviewTransaction>
  )
}

export default ReviewTokenTransfer
