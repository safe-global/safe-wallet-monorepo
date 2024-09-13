import { createNewSafe, relayReplayedSafeCreation, relaySafeCreation } from '@/components/new-safe/create/logic'
import { NetworkFee, SafeSetupOverview } from '@/components/new-safe/create/steps/ReviewStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { TxModalContext } from '@/components/tx-flow'
import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { safeCreationDispatch, SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import { selectUndeployedSafe, type UndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import {
  activateReplayedSafe,
  CF_TX_GROUP_KEY,
  extractCounterfactualSafeSetup,
  isPredictedSafeProps,
} from '@/features/counterfactual/utils'
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
import { sameAddress } from '@/utils/addresses'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { createWeb3 } from '@/hooks/wallets/web3'
import { SAFE_TO_L2_SETUP_ADDRESS } from '@/config/constants'
import CheckWallet from '@/components/common/CheckWallet'

const useActivateAccount = (undeployedSafe: UndeployedSafe | undefined) => {
  const chain = useCurrentChain()
  const [gasPrice] = useGasPrice()
  const deploymentProps = useMemo(
    () =>
      undeployedSafe && isPredictedSafeProps(undeployedSafe.props)
        ? {
            owners: undeployedSafe.props.safeAccountConfig.owners,
            saltNonce: Number(undeployedSafe.props.safeDeploymentConfig?.saltNonce ?? 0),
            threshold: undeployedSafe.props.safeAccountConfig.threshold,
          }
        : undefined,
    [undeployedSafe],
  )

  const safeVersion =
    undeployedSafe && isPredictedSafeProps(undeployedSafe?.props)
      ? undeployedSafe?.props.safeDeploymentConfig?.safeVersion
      : undefined
  const { gasLimit } = useEstimateSafeCreationGas(deploymentProps, safeVersion)

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
  const walletCanPay = useWalletCanPay({ gasLimit, maxFeePerGas, maxPriorityFeePerGas })

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
  const isMultichainSafe = sameAddress(safeAccountConfig?.to, SAFE_TO_L2_SETUP_ADDRESS)
  const ownerAddresses = undeployedSafeSetup?.owners || []
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  if (!undeployedSafe || !undeployedSafeSetup) return null

  const { owners, threshold } = undeployedSafeSetup
  const { saltNonce, safeVersion } = undeployedSafeSetup

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
        let taskId: string
        if (isPredictedSafeProps(undeployedSafe.props)) {
          taskId = await relaySafeCreation(chain, owners, threshold, Number(saltNonce!), safeVersion)
        } else {
          taskId = await relayReplayedSafeCreation(chain, undeployedSafe.props, safeVersion)
        }
        safeCreationDispatch(SafeCreationEvent.RELAYING, { groupKey: CF_TX_GROUP_KEY, taskId, safeAddress })

        onSubmit()
      } else {
        if (isPredictedSafeProps(undeployedSafe.props)) {
          await createNewSafe(
            wallet.provider,
            {
              safeAccountConfig: undeployedSafe.props.safeAccountConfig,
              saltNonce,
              options,
              callback: onSubmit,
            },
            safeVersion ?? getLatestSafeVersion(chain),
            isMultichainSafe ? true : undefined,
          )
        } else {
          // Deploy replayed Safe Creation
          const txResponse = await activateReplayedSafe(
            safeVersion ?? getLatestSafeVersion(chain),
            chain,
            undeployedSafe.props,
            createWeb3(wallet.provider),
          )
          onSubmit(txResponse.hash)
        }
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
          networks={[]}
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
          <CheckWallet checkNetwork={!submitDisabled}>
            {(isOk) => (
              <Button
                data-testid="activate-account-btn"
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
