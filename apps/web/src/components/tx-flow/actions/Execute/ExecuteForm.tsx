import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import ModalDialog from '@/components/common/ModalDialog'
import classNames from 'classnames'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCheckError from '@/components/tx/TxCheckError'
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
import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import type { SlotComponentProps, SlotName } from '../../slots'
import { TxFlowContext } from '../../TxFlowProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'

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

  const { offer, showsProUpsell, isLoading: isGasPaymentLoading, exclude } = useGasPaymentOptions({ safeTx })
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const { gasPayer, sponsorSpaceId } = getGasPayment(offer, executionMethod)
  const willRelay = gasPayer !== 'WALLET'
  const showExecutionSelector = !isGasPaymentLoading && (offer !== null || showsProUpsell)

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
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else if (err instanceof RelaySimulationError) {
        setRelaySimError(err)
      } else {
        const refusal = getGasPaymentRefusal(err, gasPayer)
        if (refusal) {
          exclude(refusal.excluded)
          setRefusalMessage(refusal.message)
        } else {
          trackError(Errors._804, err)
          setSubmitError(err)
        }
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
    isGasPaymentLoading ||
    relaySimError?.code === 'SIMULATION_FAILED' ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className={classNames(commonCss.params, { [css.noBottomBorderRadius]: showExecutionSelector })}>
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

          {showExecutionSelector && (
            <div className={css.noTopBorder}>
              <ExecutionMethodSelector
                executionMethod={executionMethod}
                setExecutionMethod={setExecutionMethod}
                offer={offer}
                showsProUpsell={showsProUpsell}
              />
            </div>
          )}
        </div>

        {/* Error messages */}
        {cannotPropose ? (
          <NonOwnerError />
        ) : isExecutionLoop ? (
          <ErrorMessage>
            Cannot execute a transaction from the Safe account itself, please connect a different account.
          </ErrorMessage>
        ) : !walletCanPay && !willRelay ? (
          <ErrorMessage level="info">
            Your connected wallet doesn&apos;t have enough funds to execute this transaction.
          </ErrorMessage>
        ) : checkError ? (
          <TxCheckError error={checkError} context="estimation" />
        ) : null}

        {refusalMessage && <ErrorMessage level="warning">{refusalMessage}</ErrorMessage>}

        {/* CGW pre-relay simulation verdict */}
        {relaySimError?.code === 'SIMULATION_FAILED' && (
          <ErrorMessage>
            This transaction is expected to fail on-chain, so it can&apos;t be relayed. Review the transaction or reject
            it.
          </ErrorMessage>
        )}

        <ModalDialog
          open={relaySimError?.code === 'INDETERMINATE_SIMULATION'}
          onClose={() => setRelaySimError(undefined)}
          dialogTitle="Confirm execution"
          chainId={currentChain?.chainId}
          data-testid="relay-indeterminate-dialog"
        >
          <div className="px-6 pt-2 pb-4">
            We couldn&apos;t review this transaction. If you execute and it fails, you&apos;ll still pay the network
            fee. You can run the simulation yourself from the Safe Shield panel before deciding.
          </div>

          <div className="flex justify-between gap-2 p-6 pt-2">
            <Button data-testid="relay-go-back-btn" variant="ghost" onClick={() => setRelaySimError(undefined)}>
              Back
            </Button>
            <Button data-testid="relay-accept-unverified-btn" disabled={isSubmitLoading} onClick={() => submitTx(true)}>
              Execute anyway
            </Button>
          </div>
        </ModalDialog>

        <div className="pt-6">
          <Separator bleed="6" />
        </div>

        <TxCardActions>
          {/* Submit button */}
          <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!submitDisabled}>
            {(isOk) =>
              tooltip ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div>
                        <SplitMenuButton
                          selected={slotId}
                          onChange={({ id }) => onChange?.(id)}
                          options={options}
                          disabled={!isOk || submitDisabled}
                          loading={isSubmitLoading}
                          tooltip={tooltip}
                        />
                      </div>
                    }
                  />
                  <TooltipContent side="top">{tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <SplitMenuButton
                  selected={slotId}
                  onChange={({ id }) => onChange?.(id)}
                  options={options}
                  disabled={!isOk || submitDisabled}
                  loading={isSubmitLoading}
                  tooltip={tooltip}
                />
              )
            }
          </CheckWallet>
        </TxCardActions>
      </form>
    </>
  )
}

export default madProps(ExecuteForm, {
  isOwner: useIsSafeOwner,
  isExecutionLoop: useIsExecutionLoop,
  txActions: useTxActions,
  txSecurity: useSafeShield,
})
