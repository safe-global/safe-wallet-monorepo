import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState, useEffect } from 'react'
import { Box, Button, CardActions, DialogActions, DialogContent, Divider, Tooltip } from '@mui/material'
import classNames from 'classnames'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ModalDialog from '@/components/common/ModalDialog'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSigner } from '@/hooks/wallets/useWallet'
import { getTxOptions } from '@/utils/transactions'
import useIsValidExecution from '@/hooks/useIsValidExecution'
import CheckWallet from '@/components/common/CheckWallet'
import { useIsExecutionLoop, useTxActions } from '@/components/tx/shared/hooks'
import { useRelaysBySafe } from '@/hooks/useRemainingRelays'
import useWalletCanRelay from '@/hooks/useWalletCanRelay'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { useNoFeeCampaignEligibility, useGasTooHigh, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'
import { hasRemainingRelays } from '@/utils/relaying'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import useGasLimit from '@/hooks/useGasLimit'
import AdvancedParams, { useAdvancedParams } from '@/components/tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import type { SlotComponentProps, SlotName } from '../../slots'
import { TxFlowContext } from '../../TxFlowProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { SafeTxContext } from '../../SafeTxProvider'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
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
  isCreation,
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
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const { isSubmitDisabled, isSubmitLoading, setIsSubmitLoading, setSubmitError, setIsRejectedByUser } =
    useContext(TxFlowContext)

  // SC wallets can relay fully signed transactions
  const [walletCanRelay, , walletCanRelayLoading] = useWalletCanRelay(safeTx)
  const relays = useRelaysBySafe()
  const { isEligible: isNoFeeCampaign, remaining, limit, blockedAddress } = useNoFeeCampaignEligibility()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const gasTooHigh = useGasTooHigh(safeTx)

  // GTF Safe-pays must go via Gelato — WALLET execution would double-charge (network gas + Safe fee).
  // For confirmers, the structural fingerprint of the signed payload is the only source of truth:
  // a stale `gtfPaymentMode === 'safe'` from the user's persisted preference must NOT force the
  // relay path on a tx whose payload doesn't carry the GTF fee fields (would fail in handlePayment).
  const { gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const isGtfChain = useHasFeature(FEATURES.GTF) ?? false
  const requiresRelay =
    (safeTx && isGtfSafePaid(safeTx.data)) ||
    (isGtfChain && !!safeTx && safeTx.signatures.size === 0 && gtfPaymentMode === 'safe' && !!gtfSelectedGasToken)

  // We default to relay, but the option is only shown if we canRelay
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)

  const noFeeCampaignEligible = !isGtfChain && isNoFeeCampaignEnabled && isNoFeeCampaign && !blockedAddress

  // Safe-pays bypasses the no-fee campaign and the daily relay quota (Safe funds its own relay).
  const canRelay =
    walletCanRelay && (requiresRelay || (!isGtfChain && !noFeeCampaignEligible && hasRemainingRelays(relays[0])))
  const canNoFeeCampaign = !requiresRelay && noFeeCampaignEligible && !gasTooHigh && !!remaining && remaining > 0
  const isLimitReached = noFeeCampaignEligible && remaining === 0

  useEffect(() => {
    if (requiresRelay) {
      setExecutionMethod(ExecutionMethod.RELAY)
      return
    }
    if (gasTooHigh || isLimitReached) {
      setExecutionMethod(ExecutionMethod.WALLET)
    }
  }, [requiresRelay, gasTooHigh, isLimitReached])

  // Handle execution method changes
  const handleExecutionMethodChange = (method: ExecutionMethod | ((prev: ExecutionMethod) => ExecutionMethod)) => {
    const newMethod = typeof method === 'function' ? method(executionMethod) : method
    setExecutionMethod(newMethod)
  }

  // Show execution selector when either no-fee campaign OR relay is available
  // Also show if gas is too high but feature is otherwise available (to show disabled state)
  // Or if limit is reached (to show 0/X available state)
  const showExecutionSelector =
    !requiresRelay &&
    !isGtfChain &&
    (canNoFeeCampaign ||
      canRelay ||
      (isNoFeeCampaignEnabled && isNoFeeCampaign && !blockedAddress && gasTooHigh) ||
      isLimitReached)

  // Determine which method will be used
  const willRelay = !!(canRelay && executionMethod === ExecutionMethod.RELAY)
  const willNoFeeCampaign = !!(
    isNoFeeCampaignEnabled &&
    canNoFeeCampaign &&
    executionMethod === ExecutionMethod.NO_FEE_CAMPAIGN
  )
  // Wait for the async SC-wallet check to settle — `walletCanRelay` is undefined while loading.
  const relayUnavailableForGtf = requiresRelay && !canRelay && !walletCanRelayLoading

  // Estimate gas limit
  const { gasLimit, gasLimitError } = useGasLimit(safeTx)
  const [advancedParams, setAdvancedParams] = useAdvancedParams(gasLimit)

  // Safe-pays runs via Gelato (not the wallet), so the simulated `from` doesn't match the
  // real msg.sender on execTransaction. We still run the check, the inner-call revert that
  // catches issues like spam-token transfers fails regardless of who calls execTransaction,
  // and missing that signal silently in Safe-pays is worse than the simulated-from drift.
  const { executionValidationError } = useIsValidExecution(
    safeTx,
    advancedParams.gasLimit ? advancedParams.gasLimit : undefined,
  )

  // CGW pre-relay simulation outcome (SIMULATION_FAILED blocks; INDETERMINATE offers an override).
  const [relaySimError, setRelaySimError] = useState<RelaySimulationError | undefined>(undefined)

  // Clear a stale simulation verdict when the payload changes (e.g. user edits params / gas token).
  useEffect(() => {
    setRelaySimError(undefined)
  }, [safeTx?.data])

  // `acceptUnverifiedSimulation` is only set when the user explicitly retries past an
  // INDETERMINATE_SIMULATION; CGW ignores it for SIMULATION_FAILED (fail-closed).
  const submitTx = async (acceptUnverifiedSimulation = false) => {
    setIsSubmitLoading(true)
    setSubmitError(undefined)
    setRelaySimError(undefined)
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
        willRelay || willNoFeeCampaign,
        acceptUnverifiedSimulation,
      )
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else if (err instanceof RelaySimulationError) {
        setRelaySimError(err)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }

      setIsSubmitLoading(false)
      return
    }

    // On success
    onSubmitSuccess?.({ txId: executedTxId, isExecuted: true })
    setTxFlow(<SuccessScreenFlow txId={executedTxId} />, undefined, false)
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

  // Parent Safe as executor cannot pay gas from the (child) Safe. The relay path doesn't
  // support this nested execution flow at this moment. Block Execute when both conditions hold so
  // the user can't submit a tx that would dead end at sign time.
  const signer = useSigner()
  const blockSafePaysFromNestedExecutor = signer?.isSafe === true && !!requiresRelay

  const submitDisabled =
    !safeTx ||
    isSubmitDisabled ||
    isSubmitLoading ||
    disableSubmit ||
    isExecutionLoop ||
    cannotPropose ||
    relayUnavailableForGtf ||
    blockSafePaysFromNestedExecutor ||
    relaySimError?.code === 'SIMULATION_FAILED' ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <>
      <form onSubmit={handleSubmit}>
        {!requiresRelay && (
          <div className={classNames(commonCss.params, { [css.noBottomBorderRadius]: canRelay })}>
            <AdvancedParams
              willExecute
              params={advancedParams}
              recommendedGasLimit={gasLimit}
              onFormSubmit={setAdvancedParams}
              gasLimitError={gasLimitError}
              willRelay={willRelay}
              noFeeCampaign={
                (canNoFeeCampaign || isLimitReached) && executionMethod !== ExecutionMethod.WALLET
                  ? { isEligible: true, remaining: remaining || 0, limit: limit || 0 }
                  : undefined
              }
            />

            {showExecutionSelector && (
              <div className={css.noTopBorder}>
                <ExecutionMethodSelector
                  executionMethod={executionMethod}
                  setExecutionMethod={handleExecutionMethodChange}
                  relays={canNoFeeCampaign ? undefined : relays[0]}
                  noFeeCampaign={
                    isNoFeeCampaign && !blockedAddress
                      ? { isEligible: true, remaining: remaining || 0, limit: limit || 0 }
                      : undefined
                  }
                  gasTooHigh={gasTooHigh}
                />
              </div>
            )}
          </div>
        )}

        {/* Error messages */}
        {cannotPropose ? (
          <NonOwnerError />
        ) : isExecutionLoop ? (
          <ErrorMessage>
            Cannot execute a transaction from the Safe Account itself, please connect a different account.
          </ErrorMessage>
        ) : relayUnavailableForGtf ? (
          <ErrorMessage>Safe-paid fees require Gelato relay, which is currently unavailable.</ErrorMessage>
        ) : blockSafePaysFromNestedExecutor ? (
          <ErrorMessage level="info">
            Can&apos;t pay gas from this Safe Account when executing through a parent Safe Account. Sign the
            transaction, or switch to another signer to execute.
          </ErrorMessage>
        ) : !walletCanPay && !willRelay && !willNoFeeCampaign ? (
          <ErrorMessage level="info">
            Your connected wallet doesn&apos;t have enough funds to execute this transaction.
          </ErrorMessage>
        ) : (
          (executionValidationError || gasLimitError) && (
            <ErrorMessage error={executionValidationError || gasLimitError} context="estimation">
              This transaction will most likely fail.
              {` To save gas costs, ${isCreation ? 'avoid creating' : 'reject'} this transaction.`}
            </ErrorMessage>
          )
        )}

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
          <DialogContent sx={{ mt: 1 }}>
            We couldn&apos;t review this transaction. If you execute and it fails, you&apos;ll still pay the network
            fee. You can run the simulation yourself from the Safe Shield panel before deciding.
          </DialogContent>

          <DialogActions>
            <Button data-testid="relay-go-back-btn" onClick={() => setRelaySimError(undefined)}>
              Back
            </Button>
            <Button
              data-testid="relay-accept-unverified-btn"
              variant="contained"
              disableElevation
              disabled={isSubmitLoading}
              onClick={() => submitTx(true)}
            >
              Execute anyway
            </Button>
          </DialogActions>
        </ModalDialog>

        <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

        <CardActions>
          {/* Submit button */}
          <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!submitDisabled}>
            {(isOk) => (
              <Tooltip title={tooltip} placement="top">
                <Box sx={{ minWidth: '112px', width: ['100%', '100%', '100%', 'auto'] }}>
                  <SplitMenuButton
                    selected={slotId}
                    onChange={({ id }) => onChange?.(id)}
                    options={options}
                    disabled={!isOk || submitDisabled}
                    loading={isSubmitLoading}
                    tooltip={tooltip}
                  />
                </Box>
              </Tooltip>
            )}
          </CheckWallet>
        </CardActions>
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
