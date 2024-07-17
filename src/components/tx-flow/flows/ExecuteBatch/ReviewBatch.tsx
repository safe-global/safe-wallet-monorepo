import { CircularProgress, Typography, Button, CardActions, Divider, Alert } from '@mui/material'
import useAsync from '@/hooks/useAsync'
import { FEATURES } from '@safe-global/safe-gateway-typescript-sdk'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { getReadOnlyMultiSendCallOnlyContract } from '@/services/contracts/safeContracts'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'
import { useState, useMemo, useContext } from 'react'
import type { SyntheticEvent } from 'react'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import DecodedTxs from '@/components/tx-flow/flows/ExecuteBatch/DecodedTxs'
import { TxSimulation } from '@/components/tx/security/tenderly'
import { WrongChainWarning } from '@/components/tx/WrongChainWarning'
import { useRelaysBySafe } from '@/hooks/useRemainingRelays'
import useOnboard from '@/hooks/wallets/useOnboard'
import { logError, Errors } from '@/services/exceptions'
import { dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
import { hasRemainingRelays } from '@/utils/relaying'
import { getTxsWithDetails, getMultiSendTxs } from '@/utils/transactions'
import TxCard from '../../common/TxCard'
import CheckWallet from '@/components/common/CheckWallet'
import type { ExecuteBatchFlowProps } from '.'
import { asError } from '@/services/exceptions/utils'
import SendToBlock from '@/components/tx/SendToBlock'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxModalContext } from '@/components/tx-flow'
import useGasPrice from '@/hooks/useGasPrice'
import { hasFeature } from '@/utils/chains'
import type { Overrides } from 'ethers'
import { trackEvent } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { isWalletRejection } from '@/utils/wallets'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import { LATEST_SAFE_VERSION } from '@/config/constants'
import useUserNonce from '@/components/tx/AdvancedParams/useUserNonce'
import useWallet from '@/hooks/wallets/useWallet'

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

  const maxFeePerGas = gasPrice?.maxFeePerGas
  const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas

  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)

  // Chain has relaying feature and available relays
  const canRelay = hasRemainingRelays(relays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY
  const onboard = useOnboard()
  const wallet = useWallet()

  const [txsWithDetails, error, loading] = useAsync<TransactionDetails[]>(() => {
    if (!chain?.chainId) return
    return getTxsWithDetails(params.txs, chain.chainId)
  }, [params.txs, chain?.chainId])

  const [multiSendContract] = useAsync(async () => {
    if (!chain?.chainId || !safe.version) return
    return await getReadOnlyMultiSendCallOnlyContract(chain.chainId, safe.version)
  }, [chain?.chainId, safe.version])

  const [multisendContractAddress = ''] = useAsync(async () => {
    if (!multiSendContract) return ''
    return await multiSendContract.getAddress()
  }, [multiSendContract])

  const [multiSendTxs] = useAsync(async () => {
    if (!txsWithDetails || !chain || !safe.version) return
    return getMultiSendTxs(txsWithDetails, chain, safe.address.value, safe.version)
  }, [chain, safe.address.value, safe.version, txsWithDetails])

  const multiSendTxData = useMemo(() => {
    if (!txsWithDetails || !multiSendTxs) return
    return encodeMultiSendData(multiSendTxs)
  }, [txsWithDetails, multiSendTxs])

  const onExecute = async () => {
    if (!userNonce || !wallet || !multiSendTxData || !multiSendContract || !txsWithDetails || !gasPrice) return

    const overrides: Overrides = isEIP1559
      ? { maxFeePerGas: maxFeePerGas?.toString(), maxPriorityFeePerGas: maxPriorityFeePerGas?.toString() }
      : { gasPrice: maxFeePerGas?.toString() }

    overrides.nonce = userNonce

    await dispatchBatchExecution(
      txsWithDetails,
      multiSendContract,
      multiSendTxData,
      wallet,
      safe.chainId,
      safe.address.value,
      overrides as Overrides & { nonce: number },
    )
  }

  const onRelay = async () => {
    if (!multiSendTxData || !multiSendContract || !txsWithDetails) return

    await dispatchBatchExecutionRelay(
      txsWithDetails,
      multiSendContract,
      multiSendTxData,
      safe.chainId,
      safe.address.value,
      safe.version ?? LATEST_SAFE_VERSION,
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

    trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.batch })
  }

  const submitDisabled = loading || !isSubmittable || !gasPrice

  return (
    <>
      <TxCard>
        <Typography variant="body2">
          This transaction batches a total of {params.txs.length} transactions from your queue into a single Ethereum
          transaction. Please check every included transaction carefully, especially if you have rejection transactions,
          and make sure you want to execute all of them. Included transactions are highlighted in green when you hover
          over the execute button.
        </Typography>

        {multiSendContract && <SendToBlock address={multisendContractAddress} title="Interact with" />}

        {multiSendTxData && (
          <div>
            <Typography variant="body2" color="text.secondary">
              Data (hex encoded)
            </Typography>
            {generateDataRowValue(multiSendTxData, 'rawData')}
          </div>
        )}

        <div>
          <DecodedTxs txs={txsWithDetails} />
        </div>
      </TxCard>

      {multiSendTxs && (
        <TxCard>
          <Typography variant="h5">Transaction checks</Typography>

          <TxSimulation transactions={multiSendTxs} disabled={submitDisabled} />
        </TxCard>
      )}

      <TxCard>
        <ConfirmationTitle variant={ConfirmationTitleTypes.execute} />

        <WrongChainWarning />

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

        {error && (
          <ErrorMessage error={error}>
            This transaction will most likely fail. To save gas costs, avoid creating the transaction.
          </ErrorMessage>
        )}

        {submitError && (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        )}

        {isRejectedByUser && <WalletRejectionError />}

        <div>
          <Divider className={commonCss.nestedDivider} sx={{ pt: 2 }} />

          <CardActions>
            <CheckWallet allowNonOwner={true}>
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
