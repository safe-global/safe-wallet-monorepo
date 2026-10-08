import useWallet from '@/hooks/wallets/useWallet'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { useState, useMemo, useContext, useCallback } from 'react'
import type { SyntheticEvent } from 'react'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import DecodedTxs from '@/components/tx-flow/flows/ExecuteBatch/DecodedTxs'
import { useGasPaymentOptions } from '@/hooks/useGasPaymentOptions'
import { getGasPayment } from '@/utils/gasPayment'
import { getGasPaymentRefusal } from '@/components/tx/gasPaymentRefusal'
import useOnboard from '@/hooks/wallets/useOnboard'
import { logError, Errors } from '@/services/exceptions'
import { createMultiSendCallOnlyTx, dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
import { getMultiSendTxs } from '@/utils/transactions'
import CheckWallet from '@/components/common/CheckWallet'
import type { ExecuteBatchFlowProps } from '.'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import SendToBlock from '@/components/tx/SendToBlock'
import { TxModalContext } from '@/components/tx-flow'
import useGasPrice from '@/hooks/useGasPrice'
import type { Overrides } from 'ethers'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { isWalletRejection } from '@/utils/wallets'
import useUserNonce from '@/components/tx/AdvancedParams/useUserNonce'
import { useTransactionsGetMultipleTransactionDetailsQuery } from '@safe-global/store/gateway/transactions'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { FEATURES, getLatestSafeVersion, hasFeature } from '@safe-global/utils/utils/chains'
import { useSafeShield, useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import type { SafeTransaction } from '@safe-global/types-kit'
import { fetchRecommendedParams } from '@/services/tx/tx-sender/recommendedNonce'
import { useMultiSendContract } from './useMultiSendContract'
import { ReviewBatchView } from '@views/components/tx-flow/flows/ExecuteBatch/ReviewBatchView'

/**
 * Build gas overrides for batch execution based on chain EIP-1559 support
 */
const buildGasOverrides = (
  isEIP1559: boolean,
  maxFeePerGas: bigint | null | undefined,
  maxPriorityFeePerGas: bigint | null | undefined,
  userNonce: number,
): Overrides & { nonce: number } => {
  const gasOverrides: Overrides = isEIP1559
    ? { maxFeePerGas: maxFeePerGas?.toString(), maxPriorityFeePerGas: maxPriorityFeePerGas?.toString() }
    : { gasPrice: maxFeePerGas?.toString() }

  return { ...gasOverrides, nonce: userNonce }
}

export const ReviewBatch = ({ params }: { params: ExecuteBatchFlowProps }) => {
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [refusalMessage, setRefusalMessage] = useState<string>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const { offer, showsProUpsell, exclude } = useGasPaymentOptions({ isBatch: true })
  const { setTxFlow } = useContext(TxModalContext)
  const [gasPrice] = useGasPrice()
  const userNonce = useUserNonce()
  const latestSafeVersion = getLatestSafeVersion(chain)
  const onboard = useOnboard()
  const wallet = useWallet()

  const { gasPayer, sponsorSpaceId } = getGasPayment(offer, executionMethod)
  const willRelay = gasPayer !== 'WALLET'

  // EIP-1559 gas pricing support
  const isEIP1559 = Boolean(chain && hasFeature(chain, FEATURES.EIP1559))

  // Safe Shield - check if risk confirmation is needed (includes untrusted Safe)
  const { needsRiskConfirmation, isRiskConfirmed } = useSafeShield()
  const isUntrustedSafeBlocked = needsRiskConfirmation && !isRiskConfirmed

  const {
    data: txsWithDetails,
    error,
    isLoading: loading,
  } = useTransactionsGetMultipleTransactionDetailsQuery(
    {
      chainId: chain?.chainId || '',
      txIds: params.txs.map((tx) => tx.transaction.id),
    },
    {
      skip: !chain?.chainId || !params.txs.length,
    },
  )

  const { multiSendContract, multiSendContractAddress } = useMultiSendContract(safe)

  const [multiSendTxs] = useAsync(async () => {
    if (!txsWithDetails || !chain || !safe.version) return
    return getMultiSendTxs(txsWithDetails, chain, safe.address.value, safe.version)
  }, [chain, safe.address.value, safe.version, txsWithDetails])

  const multiSendTxData = useMemo(() => {
    if (!txsWithDetails || !multiSendTxs) return
    return encodeMultiSendData(multiSendTxs) as `0x${string}`
  }, [txsWithDetails, multiSendTxs])

  const onExecute = useCallback(async () => {
    if (!userNonce || !onboard || !wallet || !multiSendTxData || !multiSendContract || !txsWithDetails || !gasPrice)
      return

    const overrides = buildGasOverrides(isEIP1559, gasPrice.maxFeePerGas, gasPrice.maxPriorityFeePerGas, userNonce)

    await dispatchBatchExecution(
      txsWithDetails,
      multiSendContract,
      multiSendTxData,
      wallet.provider,
      safe.chainId,
      wallet.address,
      safe.address.value,
      overrides,
      safe.nonce,
    )
  }, [userNonce, onboard, wallet, multiSendTxData, multiSendContract, txsWithDetails, gasPrice, isEIP1559, safe])

  const [safeTx] = useAsync<SafeTransaction | undefined>(async () => {
    const safeTx = multiSendTxs ? await createMultiSendCallOnlyTx(multiSendTxs) : undefined

    if (safeTx) {
      // For simulation purposes, we need to estimate gas even if the Safe version doesn't require it
      const { safeTxGas } = await fetchRecommendedParams(safe.chainId, safe.address.value, safeTx.data)
      safeTx.data.safeTxGas = safeTxGas
    }

    return safeTx
  }, [multiSendTxs, safe.chainId, safe.address.value])

  useSafeShieldForTxData(safeTx)

  const onRelay = async () => {
    if (!multiSendTxData || !multiSendContract || !txsWithDetails) return

    await dispatchBatchExecutionRelay(
      txsWithDetails,
      multiSendContract,
      multiSendTxData,
      safe.chainId,
      safe.address.value,
      safe.version ?? latestSafeVersion,
      sponsorSpaceId,
    )
  }

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setIsSubmittable(false)
    setSubmitError(undefined)
    setRefusalMessage(undefined)
    setIsRejectedByUser(false)

    try {
      await (willRelay ? onRelay() : onExecute())
      setTxFlow(undefined)
    } catch (_err) {
      const err = asError(_err)
      const refusal = getGasPaymentRefusal(err, gasPayer)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else if (refusal) {
        exclude(refusal.excluded)
        setRefusalMessage(refusal.message)
      } else {
        logError(Errors._804, err)
        setSubmitError(err)
      }

      setIsSubmittable(true)
      return
    }

    trackEvent(
      { ...TX_EVENTS.EXECUTE, label: TX_TYPES.bulk_execute },
      {
        [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.bulk_execute,
        [MixpanelEventParams.THRESHOLD]: safe.threshold,
        [MixpanelEventParams.GAS_PAYMENT_OPTION]: gasPayer,
      },
    )
  }

  const submitDisabled = loading || !isSubmittable || !gasPrice || isUntrustedSafeBlocked

  return (
    <ReviewBatchView
      txCount={params.txs.length}
      hasMultiSendContract={!!multiSendContract}
      renderSendToBlock={(props) => <SendToBlock address={multiSendContractAddress} {...props} />}
      multiSendTxData={multiSendTxData}
      decodedTxs={<DecodedTxs txs={txsWithDetails} />}
      networkWarning={<NetworkWarning />}
      showExecutionMethodSelector={offer !== null || showsProUpsell}
      renderExecutionMethodSelector={(props) => (
        <ExecutionMethodSelector
          executionMethod={executionMethod}
          setExecutionMethod={setExecutionMethod}
          offer={offer}
          showsProUpsell={showsProUpsell}
          {...props}
        />
      )}
      estimationError={error ? asError(error) : undefined}
      submitError={submitError}
      refusalMessage={refusalMessage}
      isRejectedByUser={!!isRejectedByUser}
      renderCheckWallet={(render) => (
        <CheckWallet allowNonOwner={true} checkNetwork>
          {render}
        </CheckWallet>
      )}
      submitDisabled={submitDisabled}
      isSubmittable={isSubmittable}
      onSubmit={handleSubmit}
    />
  )
}
