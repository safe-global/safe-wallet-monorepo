import type { BaseTransaction, RequestId, SendTransactionRequestParams } from '@safe-global/safe-apps-sdk'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import ReviewSafeAppsTx from './ReviewSafeAppsTx'
import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import { useCallback } from 'react'
import { type SubmitCallback, TxFlow } from '../../TxFlow'
import { type ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import { dispatchSafeAppsTx } from '@/services/tx/tx-sender'
import { trackSafeAppTxCount } from '@/services/safe-apps/track-app-usage-count'
import { getSafeTxHashFromTxId } from '@/utils/transactions'

export type SafeAppsTxParams = {
  appId?: string
  app?: Partial<SafeAppData>
  requestId: RequestId
  txs: BaseTransaction[]
  params?: SendTransactionRequestParams
}

const SafeAppsTxFlow = ({
  data,
  onSubmit,
}: {
  data: SafeAppsTxParams
  onSubmit?: (txId: string, safeTxHash: string) => void
}) => {
  const ReviewTransactionComponent = useCallback(
    (props: ReviewTransactionContentProps) => {
      return <ReviewSafeAppsTx safeAppsTx={data} {...props} />
    },
    [data],
  )

  const handleSubmit: SubmitCallback = useCallback(
    (args) => {
      if (!args || !args.txId) {
        return
      }

      const safeTxHash = getSafeTxHashFromTxId(args.txId)

      if (!safeTxHash) {
        return
      }

      trackSafeAppTxCount(Number(data.appId))
      dispatchSafeAppsTx({ safeAppRequestId: data.requestId, txId: args.txId, safeTxHash })
      onSubmit?.(args.txId, safeTxHash)
    },
    [data.appId, data.requestId, onSubmit],
  )

  return (
    <TxFlow
      onSubmit={handleSubmit}
      subtitle={<AppTitle name={data.app?.name} logoUri={data.app?.iconUrl} txs={data.txs} />}
      ReviewTransactionComponent={ReviewTransactionComponent}
    />
  )
}

export default SafeAppsTxFlow
