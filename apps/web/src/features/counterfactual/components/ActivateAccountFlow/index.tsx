import { createNewSafe, relaySafeCreation } from '@/components/new-safe/create/logic'
import { NetworkFee, SafeSetupOverview } from '@/components/new-safe/create/steps/ReviewStep'
import { TxModalContext } from '@/components/tx-flow'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxSubmitError from '@/components/tx/TxSubmitError'
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
import React, { useContext, useMemo, useState } from 'react'
import { getSafeToL2SetupVersionByAddress } from '@safe-global/utils/services/contracts/deployments'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import CheckWallet from '@/components/common/CheckWallet'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import type { TransactionOptions } from '@safe-global/types-kit'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import useGasPrice from '@/hooks/useGasPrice'
import { ActivateAccountFlowView } from '@views/features/counterfactual/components/ActivateAccountFlow/ActivateAccountFlowView'

const useActivateAccount = (undeployedSafe: UndeployedSafe | undefined) => {
  const chain = useCurrentChain()
  const [gasPrice] = useGasPrice()
  const { gasLimit } = useEstimateSafeCreationGas(undeployedSafe?.props)

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

  const isMultichainSafe = Boolean(getSafeToL2SetupVersionByAddress(safeAccountConfig?.to))

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
    <ActivateAccountFlowView
      layout={(title, children) => (
        <TxLayout title={title} hideNonce hideSafeShield>
          {children}
        </TxLayout>
      )}
      safeSetupOverview={
        <SafeSetupOverview
          owners={owners.map((owner) => ({ name: '', address: owner }))}
          threshold={threshold}
          networks={chain ? [chain] : []}
        />
      }
      executionMethodSelector={
        <ExecutionMethodSelector
          executionMethod={executionMethod}
          setExecutionMethod={setExecutionMethod}
          offer={{ option: 'FREE_DAILY_LIMIT', disabledReason: null, relays: minRelays, isPro: null }}
        />
      }
      networkFee={<NetworkFee totalFee={totalFee} isWaived={willRelay || isWrongChain} chain={chain} />}
      submitError={submitError ? <TxSubmitError error={submitError} /> : undefined}
      networkWarning={<NetworkWarning />}
      renderErrorMessage={(children) => <ErrorMessage>{children}</ErrorMessage>}
      checkWallet={(render) => (
        <CheckWallet checkNetwork={!submitDisabled} allowNonOwner allowUndeployedSafe>
          {render}
        </CheckWallet>
      )}
      canRelay={canRelay}
      willRelay={willRelay}
      isWrongChain={isWrongChain}
      chainName={chain?.chainName}
      showGasFeeEstimation={showGasFeeEstimation}
      showInsufficientFunds={!walletCanPay && !willRelay && showInsufficientFundsWarning}
      isSubmittable={isSubmittable}
      submitDisabled={submitDisabled}
      onActivate={createSafe}
    />
  )
}

export default ActivateAccountFlow
