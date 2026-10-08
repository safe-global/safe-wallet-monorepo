import { TxModalContext } from '@/components/tx-flow'
import useDeployGasLimit from '../../hooks/useDeployGasLimit'
import { deploySafeAndExecuteTx } from '../../services/safeDeployment'

import useSafeInfo from '@/hooks/useSafeInfo'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS, trackEvent, WALLET_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import madProps from '@/utils/mad-props'
import React, { type ReactElement, type SyntheticEvent, useContext, useState } from 'react'

import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCheckError from '@/components/tx/TxCheckError'
import TxSubmitError from '@/components/tx/TxSubmitError'
import { trackError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import CheckWallet from '@/components/common/CheckWallet'
import { useIsExecutionLoop } from '@/components/tx/shared/hooks'
import type { SignOrExecuteProps } from '@/components/tx/shared/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import AdvancedParams, { useAdvancedParams } from '@/components/tx/AdvancedParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { CounterfactualFormView } from '@views/features/counterfactual/components/CounterfactualForm/CounterfactualFormView'

export const CounterfactualForm = ({
  safeTx,
  disableSubmit = false,
  onlyExecute,
  isOwner,
  isExecutionLoop,
  txSecurity,
  onSubmit,
}: SignOrExecuteProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
  isExecutionLoop: ReturnType<typeof useIsExecutionLoop>
  txSecurity: ReturnType<typeof useSafeShield>
  safeTx?: SafeTransaction
  isCreation?: boolean
}): ReactElement => {
  const wallet = useWallet()
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()

  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()

  // Hooks
  const currentChain = useCurrentChain()
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const { setTxFlow } = useContext(TxModalContext)

  // Estimate gas limit
  const { gasLimit, gasLimitError } = useDeployGasLimit(safeTx)
  const [advancedParams, setAdvancedParams] = useAdvancedParams(gasLimit?.totalGas)

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    onSubmit?.(Math.random().toString())

    setIsSubmittable(false)
    setSubmitError(undefined)

    const txOptions = getTxOptions(advancedParams, currentChain)

    try {
      trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: TX_TYPES.activate_with_tx })

      await deploySafeAndExecuteTx(txOptions, wallet, safeAddress, safeTx, wallet?.provider)

      const mixpanelProps = {
        [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.activate_with_tx,
        [MixpanelEventParams.THRESHOLD]: safe.threshold,
      }
      trackEvent({ ...TX_EVENTS.CREATE, label: TX_TYPES.activate_with_tx }, mixpanelProps)
      trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.activate_with_tx }, mixpanelProps)
      trackEvent(WALLET_EVENTS.ONCHAIN_INTERACTION)
    } catch (_err) {
      const err = asError(_err)
      trackError(Errors._804, err)
      setIsSubmittable(true)
      setSubmitError(err)
      return
    }

    setTxFlow(undefined)
  }

  const walletCanPay = useWalletCanPay({
    gasLimit: gasLimit?.totalGas,
    maxFeePerGas: advancedParams.maxFeePerGas,
  })

  const cannotPropose = !isOwner && !onlyExecute
  const submitDisabled =
    !safeTx ||
    !isSubmittable ||
    disableSubmit ||
    isExecutionLoop ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <CounterfactualFormView
      baseFee={getTotalFeeFormatted(advancedParams.maxFeePerGas, BigInt(gasLimit?.safeTxGas || '0'), chain)}
      activationFee={getTotalFeeFormatted(
        advancedParams.maxFeePerGas,
        BigInt(gasLimit?.safeDeploymentGas || '0'),
        chain,
      )}
      nativeCurrencySymbol={chain?.nativeCurrency.symbol}
      advancedParams={
        <AdvancedParams
          willExecute
          params={advancedParams}
          recommendedGasLimit={gasLimit?.totalGas}
          onFormSubmit={setAdvancedParams}
          gasLimitError={gasLimitError}
          willRelay={false}
        />
      }
      cannotPropose={cannotPropose}
      isExecutionLoop={isExecutionLoop}
      walletCanPay={walletCanPay}
      nonOwnerError={<NonOwnerError />}
      txCheckError={gasLimitError && <TxCheckError error={gasLimitError} />}
      submitError={submitError ? <TxSubmitError error={submitError} /> : undefined}
      renderErrorMessage={(children) => <ErrorMessage>{children}</ErrorMessage>}
      checkWallet={(render) => (
        <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!submitDisabled}>
          {render}
        </CheckWallet>
      )}
      isSubmittable={isSubmittable}
      submitDisabled={submitDisabled}
      onSubmit={handleSubmit}
    />
  )
}

export default madProps(CounterfactualForm, {
  isOwner: useIsSafeOwner,
  isExecutionLoop: useIsExecutionLoop,
  txSecurity: useSafeShield,
})
