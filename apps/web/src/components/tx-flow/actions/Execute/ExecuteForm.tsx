import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type ReactNode, type SyntheticEvent, useContext, useState, useEffect } from 'react'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import useIsValidExecution from '@/hooks/useIsValidExecution'
import CheckWallet from '@/components/common/CheckWallet'
import { useIsExecutionLoop, useTxActions } from '@/components/tx/shared/hooks'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { useGasPaymentOptions } from '@/hooks/useGasPaymentOptions'
import { getGasPayment } from '@/utils/gasPayment'
import { getGasPaymentRefusal } from '@/components/tx/gasPaymentRefusal'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import useGasLimit from '@/hooks/useGasLimit'
import AdvancedParams, { useAdvancedParams } from '@/components/tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import type { SlotComponentProps, SlotName } from '../../slots'
import { TxFlowContext } from '../../TxFlowProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'
import { ExecuteFormView } from '@views/components/tx-flow/actions/Execute/ExecuteFormView'

export const ExecuteForm = ({
  safeTx,
  txId,
  onSubmit,
  onSubmitSuccess,
  options = [],
  onChange,
  disableSubmit = false,
  origin,
  onlyExecute,
  isOwner,
  isExecutionLoop,
  slotId,
  txActions,
  tooltip,
  txSecurity,
  secondaryAction,
}: SlotComponentProps<SlotName.ComboSubmit> & {
  txId?: string
  disableSubmit?: boolean
  onlyExecute?: boolean
  origin?: string
  isOwner: ReturnType<typeof useIsSafeOwner>
  isExecutionLoop: ReturnType<typeof useIsExecutionLoop>
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useSafeShield>
  isCreation?: boolean
  safeTx?: SafeTransaction
  tooltip?: string
  secondaryAction?: ReactNode
}): ReactElement => {
  // Hooks
  const currentChain = useCurrentChain()
  const { executeTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const scope = useSafeScope()
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const {
    isSubmitDisabled,
    isSubmitLoading,
    setIsSubmitLoading,
    setSubmitError,
    setIsRejectedByUser,
    setGasPaymentOption,
  } = useContext(TxFlowContext)

  const { offer, showsProUpsell, exclude } = useGasPaymentOptions({ safeTx })
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const { gasPayer, sponsorSpaceId } = getGasPayment(offer, executionMethod)
  const willRelay = gasPayer !== 'WALLET'
  const showExecutionSelector = offer !== null || showsProUpsell

  useEffect(() => {
    setGasPaymentOption(gasPayer)
    return () => setGasPaymentOption(undefined)
  }, [gasPayer, setGasPaymentOption])

  // Estimate gas limit
  const { gasLimit, gasLimitError } = useGasLimit(safeTx)
  const [advancedParams, setAdvancedParams] = useAdvancedParams(gasLimit)

  const { executionValidationError } = useIsValidExecution(
    safeTx,
    advancedParams.gasLimit ? advancedParams.gasLimit : undefined,
  )

  // Pre-execution check error (validity simulation or gas estimation).
  const checkError = executionValidationError || gasLimitError

  // CGW pre-relay simulation outcome (SIMULATION_FAILED blocks; INDETERMINATE offers an override).
  const [relaySimError, setRelaySimError] = useState<RelaySimulationError | undefined>(undefined)
  const [refusalMessage, setRefusalMessage] = useState<string>()

  // Clear a stale simulation verdict when the payload changes (e.g. user edits params / gas token).
  useEffect(() => {
    setRelaySimError(undefined)
    setRefusalMessage(undefined)
  }, [safeTx?.data])

  // `acceptUnverifiedSimulation` is only set when the user explicitly retries past an
  // INDETERMINATE_SIMULATION; CGW ignores it for SIMULATION_FAILED (fail-closed).
  const submitTx = async (acceptUnverifiedSimulation = false) => {
    setIsSubmitLoading(true)
    setSubmitError(undefined)
    setRelaySimError(undefined)
    setRefusalMessage(undefined)
    setIsRejectedByUser(false)

    const txOptions = getTxOptions(advancedParams, currentChain)

    onSubmit?.()

    let executedTxId: string
    try {
      executedTxId = await executeTx(
        txOptions,
        safeTx,
        txId,
        origin,
        willRelay,
        acceptUnverifiedSimulation,
        sponsorSpaceId,
      )
    } catch (_err) {
      const err = asError(_err)
      const refusal = getGasPaymentRefusal(err, gasPayer)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else if (err instanceof RelaySimulationError) {
        setRelaySimError(err)
      } else if (refusal) {
        exclude(refusal.excluded)
        setRefusalMessage(refusal.message)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }

      setIsSubmitLoading(false)
      return
    }

    // On success
    onSubmitSuccess?.({ txId: executedTxId, isExecuted: true })
    const successScope = scope ? { chainId: scope.chainId, safeAddress: scope.safeAddress } : undefined
    setTxFlow(<SuccessScreenFlow txId={executedTxId} scope={successScope} />, undefined, false)
  }

  // On modal submit
  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    submitTx()
  }

  const walletCanPay = useWalletCanPay({
    gasLimit,
    maxFeePerGas: advancedParams.maxFeePerGas,
  })

  const cannotPropose = !isOwner && !onlyExecute

  const submitDisabled =
    !safeTx ||
    isSubmitDisabled ||
    isSubmitLoading ||
    disableSubmit ||
    isExecutionLoop ||
    cannotPropose ||
    relaySimError?.code === 'SIMULATION_FAILED' ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <ExecuteFormView
      onSubmit={handleSubmit}
      showExecutionSelector={showExecutionSelector}
      advancedParams={
        <AdvancedParams
          willExecute
          params={advancedParams}
          recommendedGasLimit={gasLimit}
          onFormSubmit={setAdvancedParams}
          gasLimitError={gasLimitError}
          willRelay={willRelay}
          noFeeCampaign={
            offer?.option === 'NO_FEE_CAMPAIGN' && gasPayer === 'NO_FEE_CAMPAIGN'
              ? { isEligible: true, remaining: offer.remaining, limit: offer.limit }
              : undefined
          }
        />
      }
      executionMethodSelector={
        <ExecutionMethodSelector
          executionMethod={executionMethod}
          setExecutionMethod={setExecutionMethod}
          offer={offer}
          showsProUpsell={showsProUpsell}
        />
      }
      cannotPropose={cannotPropose}
      isExecutionLoop={isExecutionLoop}
      walletCanPay={walletCanPay}
      willRelay={willRelay}
      checkError={checkError}
      refusalMessage={refusalMessage}
      relaySimErrorCode={relaySimError?.code}
      onCloseRelayDialog={() => setRelaySimError(undefined)}
      onExecuteAnyway={() => submitTx(true)}
      isSubmitLoading={isSubmitLoading}
      chainId={currentChain?.chainId}
      secondaryAction={secondaryAction}
      renderCheckWallet={(render) => (
        <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!submitDisabled}>
          {render}
        </CheckWallet>
      )}
      slotId={slotId}
      onChange={onChange}
      options={options}
      submitDisabled={submitDisabled}
      tooltip={tooltip}
    />
  )
}

export default madProps(ExecuteForm, {
  isOwner: useIsSafeOwner,
  isExecutionLoop: useIsExecutionLoop,
  txActions: useTxActions,
  txSecurity: useSafeShield,
})
