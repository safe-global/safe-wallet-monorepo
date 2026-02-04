import useWalletCanPay from '@/hooks/useWalletCanPay'
import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState, useEffect } from 'react'
import { Box, CardActions, Divider, Tooltip } from '@mui/material'
import classNames from 'classnames'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
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
  const [walletCanRelay] = useWalletCanRelay(safeTx)
  const relays = useRelaysBySafe()
  const { isEligible: isNoFeeCampaign, remaining, limit, blockedAddress } = useNoFeeCampaignEligibility()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const gasTooHigh = useGasTooHigh(safeTx)

  // We default to relay, but the option is only shown if we canRelay
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)

  // No-fee Campaign REPLACES relay when eligible AND not blocked AND gas is not too high AND has remaining
  const canRelay = (!isNoFeeCampaign || !isNoFeeCampaignEnabled) && walletCanRelay && hasRemainingRelays(relays[0])
  const canNoFeeCampaign =
    isNoFeeCampaignEnabled && isNoFeeCampaign && !blockedAddress && !gasTooHigh && !!remaining && remaining > 0
  const isLimitReached = isNoFeeCampaignEnabled && isNoFeeCampaign && !blockedAddress && remaining === 0

  // If gas is too high or limit reached, force WALLET method
  useEffect(() => {
    if (gasTooHigh || isLimitReached) {
      setExecutionMethod(ExecutionMethod.WALLET)
    }
  }, [gasTooHigh, isLimitReached])

  // Handle execution method changes
  const handleExecutionMethodChange = (method: ExecutionMethod | ((prev: ExecutionMethod) => ExecutionMethod)) => {
    const newMethod = typeof method === 'function' ? method(executionMethod) : method
    setExecutionMethod(newMethod)
  }

  // Show execution selector when either no-fee campaign OR relay is available
  // Also show if gas is too high but feature is otherwise available (to show disabled state)
  // Or if limit is reached (to show 0/X available state)
  const showExecutionSelector =
    canNoFeeCampaign ||
    canRelay ||
    (isNoFeeCampaignEnabled && isNoFeeCampaign && !blockedAddress && gasTooHigh) ||
    isLimitReached

  // Determine which method will be used
  const willRelay = !!(canRelay && executionMethod === ExecutionMethod.RELAY)
  const willNoFeeCampaign = !!(
    isNoFeeCampaignEnabled &&
    canNoFeeCampaign &&
    executionMethod === ExecutionMethod.NO_FEE_CAMPAIGN
  )

  // Estimate gas limit
  const { gasLimit, gasLimitError } = useGasLimit(safeTx)
  const [advancedParams, setAdvancedParams] = useAdvancedParams(gasLimit)

  // Check if transaction will fail
  const { executionValidationError } = useIsValidExecution(
    safeTx,
    advancedParams.gasLimit ? advancedParams.gasLimit : undefined,
  )

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    setIsSubmitLoading(true)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    const txOptions = getTxOptions(advancedParams, currentChain)

    onSubmit?.()

    let executedTxId: string
    try {
      executedTxId = await executeTx(txOptions, safeTx, txId, origin, willRelay || willNoFeeCampaign)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
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
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <>
      <form onSubmit={handleSubmit}>
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

        {/* Error messages */}
        {cannotPropose ? (
          <NonOwnerError />
        ) : isExecutionLoop ? (
          <ErrorMessage>
            Cannot execute a transaction from the Safe Account itself, please connect a different account.
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
