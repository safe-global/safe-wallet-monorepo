import { createNewSafe, relaySafeCreation } from '@/components/new-safe/create/logic'
import { NetworkFee, SafeSetupOverview } from '@/components/new-safe/create/steps/ReviewStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { TxModalContext } from '@/components/tx-flow'
import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { safeCreationDispatch, SafeCreationEvent } from '../../services/safeCreationEvents'
import { selectUndeployedSafe } from '../../store/undeployedSafesSlice'
import {
  extractCounterfactualSafeSetup,
  isPredictedSafeProps,
  activateReplayedSafe,
} from '../../services/safeDeployment'
import { CF_TX_GROUP_KEY } from '../../constants'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS, trackEvent, WALLET_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useAppSelector } from '@/store'
import { hasRemainingRelays } from '@/utils/relaying'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import React, { useContext, useMemo, useState } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import CheckWallet from '@/components/common/CheckWallet'
import { getSafeToL2SetupDeployment } from '@safe-global/safe-deployments'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import type { TransactionOptions } from '@safe-global/types-kit'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import useGasPrice from '@/hooks/useGasPrice'

const useActivateAccount = (undeployedSafe: UndeployedSafe | undefined) => {
  const chain = useCurrentChain()
  const [gasPrice] = useGasPrice()
  const safeVersion =
    undeployedSafe &&
    (isPredictedSafeProps(undeployedSafe?.props)
      ? undeployedSafe?.props.safeDeploymentConfig?.safeVersion
      : undeployedSafe?.props.safeVersion)

  const { gasLimit } = useEstimateSafeCreationGas(undeployedSafe?.props, safeVersion)

  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)
  const maxFeePerGas = gasPrice?.maxFeePerGas
  const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas

  const options: TransactionOptions = isEIP1559
    ? {
        maxFeePerGas: maxFeePerGas?.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
        gasLimit: gasLimit?.toString(),
      }
    : { gasPrice: maxFeePerGas?.toString(), gasLimit: gasLimit?.toString() }

  const totalFee = getTotalFeeFormatted(maxFeePerGas, gasLimit, chain)
  const walletCanPay = useWalletCanPay({ gasLimit, maxFeePerGas })

  return { options, totalFee, walletCanPay }
}

const ActivateAccountFlow = () => {
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)

  const chain = useCurrentChain()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, safeAddress))
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const { options, totalFee, walletCanPay } = useActivateAccount(undeployedSafe)
  const isWrongChain = useIsWrongChain()
  const { showGasFeeEstimation, showInsufficientFundsWarning } = useNativeTokenDisplay()

  const undeployedSafeSetup = useMemo(
    () => extractCounterfactualSafeSetup(undeployedSafe, chainId),
    [undeployedSafe, chainId],
  )

  const safeAccountConfig =
    undeployedSafe && isPredictedSafeProps(undeployedSafe?.props) ? undeployedSafe?.props.safeAccountConfig : undefined

  const ownerAddresses = undeployedSafeSetup?.owners || []
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  if (!undeployedSafe || !undeployedSafeSetup) return null

  const { owners, threshold } = undeployedSafeSetup

  const safeToL2SetupDeployment = getSafeToL2SetupDeployment({ version: '1.4.1' })
  const safeToL2SetupAddress = safeToL2SetupDeployment?.defaultAddress
  const isMultichainSafe = sameAddress(safeAccountConfig?.to, safeToL2SetupAddress)

  const onSubmit = (txHash?: string) => {
    const mixpanelProps = {
      [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.activate_without_tx,
      [MixpanelEventParams.THRESHOLD]: threshold,
    }
    trackEvent({ ...TX_EVENTS.CREATE, label: TX_TYPES.activate_without_tx }, mixpanelProps)
    trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.activate_without_tx }, mixpanelProps)
    trackEvent(WALLET_EVENTS.ONCHAIN_INTERACTION)

    if (txHash) {
      safeCreationDispatch(SafeCreationEvent.PROCESSING, { groupKey: CF_TX_GROUP_KEY, txHash, safeAddress })
    }
    setTxFlow(undefined)
  }

  const createSafe = async () => {
    if (!wallet || !chain) return

    trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: TX_TYPES.activate_without_tx })

    setIsSubmittable(false)
    setSubmitError(undefined)

    try {
      if (willRelay) {
        const taskId = await relaySafeCreation(chain, undeployedSafe.props)
        safeCreationDispatch(SafeCreationEvent.RELAYING, { groupKey: CF_TX_GROUP_KEY, taskId, safeAddress })

        onSubmit()
      } else {
        await createNewSafe(
          wallet.provider,
          undeployedSafe.props,
          chain,
          options,
          onSubmit,
          isMultichainSafe ? true : undefined,
          activateReplayedSafe,
        )
      }
    } catch (_err) {
      const err = asError(_err)
      setIsSubmittable(true)
      setSubmitError(err)
      return
    }
  }

  const submitDisabled = !isSubmittable || isWrongChain

  return (
    <TxLayout title="Activate account" hideNonce hideSafeShield>
      <TxCard>
        <Typography>
          You&apos;re about to deploy this Safe Account and will have to confirm the transaction with your connected
          wallet.
        </Typography>

        <Separator className="-mx-6 my-4 w-auto" />

        <SafeSetupOverview
          owners={owners.map((owner) => ({ name: '', address: owner }))}
          threshold={threshold}
          networks={chain ? [chain] : []}
        />

        {showGasFeeEstimation && <Separator className="-mx-6 mt-4 mb-2 w-auto" />}
        <div className="flex flex-col gap-6">
          {canRelay && (
            <div>
              <ReviewRow
                name="Execution method"
                value={
                  <ExecutionMethodSelector
                    executionMethod={executionMethod}
                    setExecutionMethod={setExecutionMethod}
                    relays={minRelays}
                  />
                }
              />
            </div>
          )}

          {showGasFeeEstimation && (
            <div data-testid="network-fee-section">
              <ReviewRow
                name="Est. network fee"
                value={
                  <>
                    <NetworkFee totalFee={totalFee} isWaived={willRelay || isWrongChain} chain={chain} />

                    {!willRelay && (
                      <Typography variant="paragraph-small" color="muted" className="mt-2">
                        {isWrongChain
                          ? `Switch your connected wallet to ${chain?.chainName} to see the correct estimated network fee`
                          : 'You will have to confirm a transaction with your connected wallet.'}
                      </Typography>
                    )}
                  </>
                }
              />
            </div>
          )}

          {submitError && (
            <div className="mt-2">
              <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
            </div>
          )}
          {isWrongChain && <NetworkWarning />}
          {!walletCanPay && !willRelay && showInsufficientFundsWarning && (
            <ErrorMessage>
              Your connected wallet doesn&apos;t have enough funds to execute this transaction
            </ErrorMessage>
          )}
        </div>

        <Separator className="-mx-6 mt-4 mb-2 w-auto" />

        <div className="flex flex-row justify-end gap-6">
          <CheckWallet checkNetwork={!submitDisabled} allowNonOwner allowUndeployedSafe>
            {(isOk) => (
              <Button
                data-testid="activate-account-flow-btn"
                onClick={createSafe}
                size="lg"
                disabled={!isOk || submitDisabled}
              >
                {!isSubmittable ? <Spinner className="size-5" /> : 'Activate'}
              </Button>
            )}
          </CheckWallet>
        </div>
      </TxCard>
    </TxLayout>
  )
}

export default ActivateAccountFlow
