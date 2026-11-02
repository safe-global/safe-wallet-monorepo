import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import ReviewSignMessageOnChain, {
  type SignMessageOnChainProps,
} from '@/components/tx-flow/flows/SignMessageOnChain/ReviewSignMessageOnChain'
import { useCallback } from 'react'
import { TxFlowType } from '@/services/analytics/types'
import { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlow } from '../../TxFlow'
import { type SubmitCallback } from '@safe-global/views/components/tx-flow/types'
import { dispatchSafeAppsTx } from '@/services/tx/tx-sender/dispatch'
import { getSafeTxHashFromTxId } from '@/utils/transactions'

const SignMessageOnChainFlow = ({ props }: { props: Omit<SignMessageOnChainProps, 'onSubmit'> }) => {
  const { requestId } = props
  const ReviewComponent = useCallback(
    (reviewTxProps: ReviewTransactionProps) => {
      return <ReviewSignMessageOnChain {...props} {...reviewTxProps} />
    },
    [props],
  )

  const handleSubmit: SubmitCallback = useCallback(
    async (args) => {
      if (!args?.txId) {
        return
      }
      const safeTxHash = getSafeTxHashFromTxId(args.txId)

      if (!safeTxHash) {
        return
      }

      await dispatchSafeAppsTx({ safeAppRequestId: requestId, safeTxHash, txId: args.txId })
    },
    [requestId],
  )

  return (
    <TxFlow
      subtitle={<AppTitle name={props.app?.name} logoUri={props.app?.iconUrl} />}
      eventCategory={TxFlowType.SIGN_MESSAGE_ON_CHAIN}
      ReviewTransactionComponent={ReviewComponent}
      onSubmit={handleSubmit}
    />
  )
}

export default SignMessageOnChainFlow
