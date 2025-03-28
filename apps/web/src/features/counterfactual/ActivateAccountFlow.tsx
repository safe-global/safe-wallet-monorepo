import { createNewSafe, relaySafeCreation } from '@/components/new-safe/create/logic'
import { NetworkFee, SafeSetupOverview } from '@/components/new-safe/create/steps/ReviewStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { TxModalContext } from '@/components/tx-flow'
import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { safeCreationDispatch, SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import { selectUndeployedSafe, type UndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { CF_TX_GROUP_KEY, extractCounterfactualSafeSetup, isPredictedSafeProps } from '@/features/counterfactual/utils'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useGasPrice, { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { OVERVIEW_EVENTS, trackEvent, WALLET_EVENTS } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { asError } from '@/services/exceptions/utils'
import { useAppSelector } from '@/store'
import { hasFeature } from '@/utils/chains'
import { hasRemainingRelays } from '@/utils/relaying'
import { Box, Button, CircularProgress, Divider, Grid, Typography } from '@mui/material'
import type { DeploySafeProps } from '@safe-global/protocol-kit'
import { FEATURES } from '@/utils/chains'
import React, { useContext, useMemo, useState } from 'react'
import { getLatestSafeVersion } from '@/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import CheckWallet from '@/components/common/CheckWallet'
import { getSafeToL2SetupDeployment } from '@safe-global/safe-deployments'

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

  const options: DeploySafeProps['options'] = isEIP1559
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

  const { owners, threshold, safeVersion } = undeployedSafeSetup

  const safeToL2SetupDeployment = getSafeToL2SetupDeployment({ version: '1.4.1', network: chain?.chainId })
  const safeToL2SetupAddress = safeToL2SetupDeployment?.defaultAddress
  const isMultichainSafe = sameAddress(safeAccountConfig?.to, safeToL2SetupAddress)

  const onSubmit = (txHash?: string) => {
    trackEvent({ ...TX_EVENTS.CREATE, label: TX_TYPES.activate_without_tx })
    trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.activate_without_tx })
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
          safeVersion ?? getLatestSafeVersion(chain),
          chain,
          options,
          onSubmit,
          isMultichainSafe ? true : undefined,
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
    <TxLayout title="Activate account" hideNonce>
      <TxCard>
        <Typography>
          You&apos;re about to deploy this Safe Account and will have to confirm the transaction with your connected
          wallet.
        </Typography>

        <Divider sx={{ mx: -3, my: 2 }} />

        <SafeSetupOverview
          owners={owners.map((owner) => ({ name: '', address: owner }))}
          threshold={threshold}
          networks={chain ? [chain] : []}
        />

        <Divider sx={{ mx: -3, mt: 2, mb: 1 }} />
        <Box display="flex" flexDirection="column" gap={3}>
          {canRelay && (
            <Grid container spacing={3}>
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
            </Grid>
          )}

          <Grid data-testid="network-fee-section" container spacing={3}>
            <ReviewRow
              name="Est. network fee"
              value={
                <>
                  <NetworkFee totalFee={totalFee} isWaived={willRelay || isWrongChain} chain={chain} />

                  {!willRelay && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {isWrongChain
                        ? `Switch your connected wallet to ${chain?.chainName} to see the correct estimated network fee`
                        : 'You will have to confirm a transaction with your connected wallet.'}
                    </Typography>
                  )}
                </>
              }
            />
          </Grid>

          {submitError && (
            <Box mt={1}>
              <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
            </Box>
          )}
          {isWrongChain && <NetworkWarning />}
          {!walletCanPay && !willRelay && (
            <ErrorMessage>
              Your connected wallet doesn&apos;t have enough funds to execute this transaction
            </ErrorMessage>
          )}
        </Box>

        <Divider sx={{ mx: -3, mt: 2, mb: 1 }} />

        <Box display="flex" flexDirection="row" justifyContent="flex-end" gap={3}>
          <CheckWallet checkNetwork={!submitDisabled} allowNonOwner allowUndeployedSafe>
            {(isOk) => (
              <Button
                data-testid="activate-account-flow-btn"
                onClick={createSafe}
                variant="contained"
                size="stretched"
                disabled={!isOk || submitDisabled}
              >
                {!isSubmittable ? <CircularProgress size={20} /> : 'Activate'}
              </Button>
            )}
          </CheckWallet>
        </Box>
      </TxCard>
    </TxLayout>
  )
}

export default ActivateAccountFlow
