import { GetTokenInfoDto } from '@/components/pro/types'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import ReviewTransaction, { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { updateCryptoPaymentIntent } from '@/services/pro/api'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { Alert } from '@mui/material'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useContext, useState } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import { TxFlowContext } from '../../TxFlowProvider'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

const PayInCryptoReview = (props: ReviewTransactionProps) => {
  const { safe, safeLoaded } = useSafeInfo()
  const spaceId = useCurrentSpaceId()
  const { data } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const tokenInfo = data.tokenInfo as GetTokenInfoDto
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const [isValid, setIsValid] = useState<boolean>(false)

  useAsync(async () => {
    const txs: MetaTransactionData[] = [
      {
        to: tokenInfo.address,
        value: '0',
        data: data.callData,
        operation: 0, // CALL operation
      },
    ]
    const safeTxPromise = txs.length > 1 ? createMultiSendCallOnlyTx(txs) : createTx(txs[0])

    safeTxPromise.then(setSafeTx).catch(setSafeTxError)
  }, [safe, safeLoaded, chain, setSafeTx, setSafeTxError, data.callData])

  useAsync(async () => {
    try {
      if (!safeTx) {
        console.log('No safe transaction available')
        return
      }
      await updateCryptoPaymentIntent(spaceId as string, data.subscriptionId, safeTx.data)
      setIsValid(true)
    } catch (error) {
      console.error('Error updating crypto payment intent:', error)
      setIsValid(false)
      setSafeTxError(new Error('Failed to update crypto payment intent'))
    }
  }, [safeTx])

  return (
    <div>
      {isValid ? (
        <Alert severity="success" style={{ marginBottom: '1em' }}>
          Your payment intent has been successfully created. You can now proceed with the transaction.
        </Alert>
      ) : (
        <Alert severity="warning" style={{ marginBottom: '1em' }}>
          Your payment intent is not valid. Please check the details and try again.
        </Alert>
      )}
      <ReviewTransaction {...props} />
    </div>
  )
}

const PayInCryptoFlow = ({
  subscriptionId,
  tokenInfo,
  callData,
}: {
  subscriptionId: string
  tokenInfo: GetTokenInfoDto
  callData: string
}) => {
  return (
    <div>
      <TxFlow
        initialData={{ subscriptionId, tokenInfo, callData }}
        eventCategory={TxFlowType.TOKEN_TRANSFER}
        isBatchable={false}
        hideNonce={true}
        subtitle="User pays in crypto"
        ReviewTransactionComponent={PayInCryptoReview}
      />
    </div>
  )
}

export default PayInCryptoFlow
