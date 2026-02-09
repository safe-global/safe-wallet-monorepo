import useWallet from '@/hooks/wallets/useWallet'
import { CircularProgress, Typography, Button, CardActions, Divider, Alert } from '@mui/material'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getReadOnlyMultiSendCallOnlyContract } from '@/services/contracts/safeContracts'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'
import { useState, useMemo, useContext, useCallback } from 'react'
import type { SyntheticEvent } from 'react'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import DecodedTxs from '@/components/tx-flow/flows/ExecuteBatch/DecodedTxs'
import { useRelaysBySafe } from '@/hooks/useRemainingRelays'
import useOnboard from '@/hooks/wallets/useOnboard'
import { logError, Errors } from '@/services/exceptions'
import { createMultiSendCallOnlyTx, dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
import { hasRemainingRelays } from '@/utils/relaying'
import { getMultiSendTxs } from '@/utils/transactions'
import TxCard from '../../common/TxCard'
import CheckWallet from '@/components/common/CheckWallet'
import type { ExecuteBatchFlowProps } from '.'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import SendToBlock from '@/components/tx/SendToBlock'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/shared/ConfirmationTitle'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxModalContext } from '@/components/tx-flow'
import useGasPrice from '@/hooks/useGasPrice'
import type { Overrides } from 'ethers'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { isWalletRejection } from '@/utils/wallets'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import useUserNonce from '@/components/tx/AdvancedParams/useUserNonce'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { useTransactionsGetMultipleTransactionDetailsQuery } from '@safe-global/store/gateway/transactions'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { FEATURES, getLatestSafeVersion, hasFeature } from '@safe-global/utils/utils/chains'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import type { SafeTransaction } from '@safe-global/types-kit'
import { fetchRecommendedParams } from '@/services/tx/tx-sender/recommendedNonce'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

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

const BatchErrorMessages = ({
  estimationError,
  submitError,
  isRejectedByUser,
}: {
  estimationError: unknown
  submitError: Error | undefined
  isRejectedByUser: Boolean
}) => (
  <>
    {estimationError && (
      <ErrorMessage error={asError(estimationError)} context="estimation">
        This transaction will most likely fail. To save gas costs, avoid creating the transaction.
      </ErrorMessage>
    )}
    {submitError && (
      <ErrorMessage error={submitError} context="execution">
        Error submitting the transaction. Please try again.
      </ErrorMessage>
    )}
    {isRejectedByUser && <WalletRejectionError />}
  </>
)

export const ReviewBatch = ({ params }: { params: ExecuteBatchFlowProps }) => {
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const [relays] = useRelaysBySafe()
  const { setTxFlow } = useContext(TxModalContext)
  const [gasPrice] = useGasPrice()
  const userNonce = useUserNonce()
  const latestSafeVersion = getLatestSafeVersion(chain)
  const onboard = useOnboard()
  const wallet = useWallet()

  // Chain has relaying feature and available relays
  const canRelay = hasRemainingRelays(relays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

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

  const [multiSendContract] = useAsync(async () => {
    if (!safe.version) return
    return await getReadOnlyMultiSendCallOnlyContract(safe.version)
  }, [safe.version])

  const [multisendContractAddress = ''] = useAsync(async () => {
    if (!multiSendContract) return ''
    return multiSendContract.getAddress()
  }, [multiSendContract])

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
    )
  }

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setIsSubmittable(false)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    try {
      await (willRelay ? onRelay() : onExecute())
      setTxFlow(undefined)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
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
      },
    )
  }

  const submitDisabled = loading || !isSubmittable || !gasPrice || isUntrustedSafeBlocked

  return (
    <>
      <TxCard>
        <Typography variant="body2">
          This transaction batches a total of {params.txs.length} transactions from your queue into a single Ethereum
          transaction. Please check every included transaction carefully, especially if you have rejection transactions,
          and make sure you want to execute all of them. Included transactions are highlighted when you hover over the
          execute button.
        </Typography>

        {multiSendContract && <SendToBlock address={multisendContractAddress} title="Interact with" />}

        {multiSendTxData && <HexEncodedData title="Data" hexData={multiSendTxData} />}

        <div>
          <DecodedTxs txs={txsWithDetails} />
        </div>

        <Divider sx={{ mt: 2, mx: -3 }} />

        <ConfirmationTitle variant={ConfirmationTitleTypes.execute} />

        <NetworkWarning />

        {canRelay ? (
          <>
            <ExecutionMethodSelector
              executionMethod={executionMethod}
              setExecutionMethod={setExecutionMethod}
              relays={relays}
              tooltip="You can only relay multisend transactions containing executions from the same Safe Account."
            />
          </>
        ) : null}

        <Alert severity="warning">
          Be aware that if any of the included transactions revert, none of them will be executed. This will result in
          the loss of the allocated transaction fees.
        </Alert>

        <BatchErrorMessages estimationError={error} submitError={submitError} isRejectedByUser={isRejectedByUser} />

        <div>
          <Divider className={commonCss.nestedDivider} sx={{ pt: 2 }} />

          <CardActions>
            <CheckWallet allowNonOwner={true} checkNetwork>
              {(isOk) => (
                <Button
                  variant="contained"
                  type="submit"
                  disabled={!isOk || submitDisabled}
                  onClick={handleSubmit}
                  sx={{ minWidth: '114px' }}
                >
                  {!isSubmittable ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
              )}
            </CheckWallet>
          </CardActions>
        </div>
      </TxCard>
    </>
  )
}
