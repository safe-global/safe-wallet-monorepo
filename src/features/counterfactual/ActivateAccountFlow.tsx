import { createNewSafe, relaySafeCreation } from '@/components/new-safe/create/logic'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { NetworkFee } from '@/components/new-safe/create/steps/ReviewStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { TxModalContext } from '@/components/tx-flow'
import TxCard from '@/components/tx-flow/common/TxCard'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import useDeployGasLimit from '@/features/counterfactual/hooks/useDeployGasLimit'
import { safeCreationDispatch, SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { CF_TX_GROUP_KEY } from '@/features/counterfactual/utils'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useGasPrice, { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3 } from '@/hooks/wallets/web3'
import { OVERVIEW_EVENTS, trackEvent, WALLET_EVENTS } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { asError } from '@/services/exceptions/utils'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'
import { useAppSelector } from '@/store'
import { hasFeature } from '@/utils/chains'
import { hasRemainingRelays } from '@/utils/relaying'
import { Box, Button, CircularProgress, Divider, Grid, Typography } from '@mui/material'
import type { DeploySafeProps } from '@safe-global/protocol-kit'
import { FEATURES } from '@safe-global/safe-gateway-typescript-sdk'
import React, { useContext, useState } from 'react'

const useActivateAccount = () => {
  const chain = useCurrentChain()
  const [gasPrice] = useGasPrice()
  const { gasLimit } = useDeployGasLimit()

  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)
  const maxFeePerGas = gasPrice?.maxFeePerGas
  const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas

  const options: DeploySafeProps['options'] = isEIP1559
    ? {
        maxFeePerGas: maxFeePerGas?.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
        gasLimit: gasLimit?.totalGas.toString(),
      }
    : { gasPrice: maxFeePerGas?.toString(), gasLimit: gasLimit?.totalGas.toString() }

  const totalFee = getTotalFeeFormatted(maxFeePerGas, gasLimit?.totalGas, chain)
  const walletCanPay = useWalletCanPay({ gasLimit: gasLimit?.totalGas, maxFeePerGas, maxPriorityFeePerGas })

  return { options, totalFee, walletCanPay }
}

const ActivateAccountFlow = () => {
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)

  const isWrongChain = useIsWrongChain()
  const chain = useCurrentChain()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const provider = useWeb3()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, safeAddress))
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const { options, totalFee, walletCanPay } = useActivateAccount()

  const ownerAddresses = undeployedSafe?.props.safeAccountConfig.owners || []
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  if (!undeployedSafe) return null

  const { owners, threshold } = undeployedSafe.props.safeAccountConfig
  const { saltNonce, safeVersion } = undeployedSafe.props.safeDeploymentConfig || {}

  const onSubmit = (txHash?: string) => {
    trackEvent({ ...TX_EVENTS.CREATE, label: TX_TYPES.activate_without_tx })
    trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.activate_without_tx })
    trackEvent(WALLET_EVENTS.ONCHAIN_INTERACTION)

    if (txHash) {
      safeCreationDispatch(SafeCreationEvent.PROCESSING, { groupKey: CF_TX_GROUP_KEY, txHash })
    }
    setTxFlow(undefined)
  }

  const createSafe = async () => {
    if (!provider || !chain) return

    trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: TX_TYPES.activate_without_tx })

    setIsSubmittable(false)
    setSubmitError(undefined)

    try {
      if (willRelay) {
        const taskId = await relaySafeCreation(chain, owners, threshold, Number(saltNonce!), safeVersion)
        safeCreationDispatch(SafeCreationEvent.RELAYING, { groupKey: CF_TX_GROUP_KEY, taskId })

        onSubmit()
      } else {
        await createNewSafe(
          provider,
          {
            safeAccountConfig: undeployedSafe.props.safeAccountConfig,
            saltNonce,
            options,
            callback: onSubmit,
          },
          safeVersion,
        )
      }
    } catch (_err) {
      const err = asError(_err)
      setIsSubmittable(true)
      setSubmitError(err)
      return
    }
  }

  const submitDisabled = !isSubmittable
  const isSocialLogin = isSocialLoginWallet(wallet?.label)

  return (
    <TxLayout title="Activate account" hideNonce>
      <TxCard>
        <Typography>
          You&apos;re about to deploy this Safe Account and will have to confirm the transaction with your connected
          wallet.
        </Typography>

        <Divider sx={{ mx: -3, my: 2 }} />

        {/* <SafeSetupOverview owners={owners.map((owner) => ({ name: '', address: owner }))} threshold={threshold} /> */}

        <Divider sx={{ mx: -3, mt: 2, mb: 1 }} />
        <Box display="flex" flexDirection="column" gap={3}>
          {canRelay && !isSocialLogin && (
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
                  <NetworkFee totalFee={totalFee} willRelay={willRelay} chain={chain} />

                  {!willRelay && !isSocialLogin && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      You will have to confirm a transaction with your connected wallet.
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
          <Button onClick={createSafe} variant="contained" size="stretched" disabled={submitDisabled}>
            {!isSubmittable ? <CircularProgress size={20} /> : 'Activate'}
          </Button>
        </Box>
      </TxCard>
    </TxLayout>
  )
}

export default ActivateAccountFlow
