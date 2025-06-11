import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createCryptoPaymentIntent, getTokenAddresses, updateCryptoPaymentIntent } from '@/services/pro/api'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { parseUnits } from 'ethers'
import { useContext, useEffect, useState } from 'react'
import { SafeTxContext } from '../tx-flow/SafeTxProvider'
import type { ReviewTransactionProps } from '../tx/ReviewTransactionV2'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import type { GetTokenInfoDto } from './types'
import { TxFlow } from '../tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import { TxFlowContext } from '../tx-flow/TxFlowProvider'
import { Alert, Button } from '@mui/material'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

const PayincryptoReview = (props: ReviewTransactionProps) => {
  const { safe, safeLoaded } = useSafeInfo()
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
      await updateCryptoPaymentIntent(data.subscriptionId, safeTx?.data)
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

export const PayinCrypto = ({
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
        ReviewTransactionComponent={PayincryptoReview}
      />
    </div>
  )
}

export const PayinCryptoSelector = ({ planId }: { planId: string }) => {
  const spaceId = useCurrentSpaceId()
  const [tokenAddresses, setTokenAddresses] = useState<GetTokenInfoDto[]>([])
  const [selectedToken, setSelectedToken] = useState<GetTokenInfoDto>()
  const [subscriptionId, setSubscriptionId] = useState<string>('')
  const chain = useCurrentChain()
  const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_PRO_RECEIVER_ADDRESS as string
  const PRICE = '1'
  const ERC20_INTERFACE = ERC20__factory.createInterface()
  const [calldata, setCallData] = useState<string>('0x')
  const [showPay, setShowPay] = useState(false)

  useAsync(async () => {
    if (!chain) return
    const addresses = await getTokenAddresses(chain.chainId)
    setTokenAddresses(addresses)
  }, [chain])

  useEffect(() => {
    if (selectedToken) {
      const callData = ERC20_INTERFACE.encodeFunctionData('transfer', [
        RECEIVER_ADDRESS,
        parseUnits(PRICE, selectedToken.decimals),
      ])
      setCallData(callData)
    }
  }, [selectedToken])

  const onHandleClickPay = async (tokenInfo: GetTokenInfoDto) => {
    setSelectedToken(tokenInfo)
    setShowPay(false)
    if (!chain) return
    const result = await createCryptoPaymentIntent(planId, spaceId as string, tokenInfo.address, chain.chainId)
    setSubscriptionId(result.subscriptionId)
  }

  return (
    <div>
      {!showPay && (
        <div>
          <h2>Pay in Crypto</h2>
          {tokenAddresses.map((tokenInfo) => (
            <Button
              variant="outlined"
              key={tokenInfo.address}
              onClick={() => {
                onHandleClickPay(tokenInfo)
              }}
              style={{ fontWeight: selectedToken?.address === tokenInfo.address ? 'bold' : 'normal', marginRight: 8 }}
            >
              {tokenInfo.symbol}
            </Button>
          ))}
        </div>
      )}

      {selectedToken && !showPay && (
        <div style={{ margin: '1em 0' }}>
          Price: {PRICE} {selectedToken.symbol}
        </div>
      )}
      {selectedToken && !showPay && (
        <Button variant="contained" onClick={() => setShowPay(true)}>
          Pay
        </Button>
      )}
      {selectedToken && showPay && (
        <PayinCrypto subscriptionId={subscriptionId} callData={calldata} tokenInfo={selectedToken} />
      )}
    </div>
  )
}
