import ReviewRow from '@/components/new-safe/ReviewRow'
import type { NewSafeFormData } from '@/components/new-safe/create'
import {
  computeNewSafeAddress,
  createNewSafe,
  createNewUndeployedSafeWithoutSalt,
  relaySafeCreation,
} from '@/components/new-safe/create/logic'
import { getAvailableSaltNonce } from '@/components/new-safe/create/logic/utils'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import chains from '@/config/chains'
import { AppRoutes } from '@/config/routes'
import PayNowPayLater, { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { SafeCreationEvent, safeCreationDispatch } from '@/features/counterfactual/services/safeCreationEvents'
import { CF_TX_GROUP_KEY, replayCounterfactualSafeDeployment } from '@/features/counterfactual/utils'
import { predictAddressBasedOnReplayData } from '@/features/multichain/utils/utils'
import useAllSafes from '@/features/myAccounts/hooks/useAllSafes'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useGasPrice, { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/hooks/wallets/web3'
import { CREATE_SAFE_CATEGORY, CREATE_SAFE_EVENTS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { gtmSetChainId, gtmSetSafeAddress } from '@/services/analytics/gtm'
import { asError } from '@/services/exceptions/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { type ReplayedSafeProps } from '@/store/slices'
import { FEATURES, hasFeature } from '@/utils/chains'
import { hasRemainingRelays } from '@/utils/relaying'
import { isWalletRejection } from '@/utils/wallets'
import { Box, Grid, Typography } from '@mui/material'
import { type DeploySafeProps } from '@safe-global/protocol-kit'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { NetworkFee } from '.'
import NetworkWarning from '../../NetworkWarning'
import { updateAddressBook } from '../../logic/address-book'

export type UseSubmitReviewHandlerProps = {
  data: NewSafeFormData
  onSubmit: (data: Partial<NewSafeFormData>) => void
  setSubmitError: Dispatch<SetStateAction<string | undefined>>
  setIsCreating: Dispatch<SetStateAction<boolean>>
}

export type ReviewType = {
  handleCreateSafeClick: () => void
  isCounterfactualEnabled?: boolean
  isMultiChainDeployment: boolean
  chain?: ChainInfo
  totalFee: string
  canRelay: boolean
  willRelay: boolean
  walletCanPay: boolean
  payMethod: PayMethod
  setPayMethod: Dispatch<SetStateAction<PayMethod>>
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  minRelays: any
  showNetworkWarning: boolean
}

export const useSubmitReviewHandler = ({
  data,
  onSubmit,
  setSubmitError,
  setIsCreating,
}: UseSubmitReviewHandlerProps): ReviewType => {
  const isWrongChain = useIsWrongChain()
  const chain = useCurrentChain()
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [gasPrice] = useGasPrice()
  const customRpc = useAppSelector(selectRpc)
  const [payMethod, setPayMethod] = useState(PayMethod.PayLater)
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const isCounterfactualEnabled = useHasFeature(FEATURES.COUNTERFACTUAL)
  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)

  const ownerAddresses = useMemo(() => data.owners.map((owner) => owner.address), [data.owners])
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  const isMultiChainDeployment = data.networks.length > 1

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  const newSafeProps = useMemo(
    () =>
      chain
        ? createNewUndeployedSafeWithoutSalt(
            data.safeVersion,
            {
              owners: data.owners.map((owner) => owner.address),
              threshold: data.threshold,
              paymentReceiver: data.paymentReceiver,
            },
            chain,
          )
        : undefined,
    [chain, data.owners, data.safeVersion, data.threshold, data.paymentReceiver],
  )

  const safePropsForGasEstimation = useMemo(() => {
    return newSafeProps
      ? {
          ...newSafeProps,
          saltNonce: Date.now().toString(),
        }
      : undefined
  }, [newSafeProps])

  // We estimate with a random nonce as we'll just slightly overestimates like this
  const { gasLimit } = useEstimateSafeCreationGas(safePropsForGasEstimation, data.safeVersion)

  const maxFeePerGas = gasPrice?.maxFeePerGas
  const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas

  const walletCanPay = useWalletCanPay({ gasLimit, maxFeePerGas })

  const totalFee = getTotalFeeFormatted(maxFeePerGas, gasLimit, chain)

  const allSafes = useAllSafes()
  const knownAddresses = useMemo(() => uniq(allSafes?.map((safe) => safe.address)), [allSafes])

  const customRPCs = useAppSelector(selectRpc)

  const handleCreateSafeClick = async () => {
    try {
      if (!wallet || !chain || !newSafeProps) return

      setIsCreating(true)

      // Figure out the shared available nonce across chains
      const nextAvailableNonce =
        data.saltNonce !== undefined
          ? data.saltNonce.toString()
          : await getAvailableSaltNonce(customRPCs, { ...newSafeProps, saltNonce: '0' }, data.networks, knownAddresses)

      const replayedSafeWithNonce = { ...newSafeProps, saltNonce: nextAvailableNonce }

      const customRpcUrl = customRpc[chain.chainId]
      const provider = createWeb3ReadOnly(chain, customRpcUrl)
      if (!provider) return

      let safeAddress: string

      if (chain.chainId === chains['zksync']) {
        safeAddress = await computeNewSafeAddress(
          customRpcUrl || getRpcServiceUrl(chain.rpcUri),
          {
            safeAccountConfig: replayedSafeWithNonce.safeAccountConfig,
            saltNonce: nextAvailableNonce,
          },
          chain,
          replayedSafeWithNonce.safeVersion,
        )
      } else {
        safeAddress = await predictAddressBasedOnReplayData(replayedSafeWithNonce, provider)
      }

      for (const network of data.networks) {
        await createSafe(network, replayedSafeWithNonce, safeAddress)
      }

      // Update addressbook with owners and Safe on all chosen networks
      dispatch(
        updateAddressBook(
          data.networks.map((network) => network.chainId),
          safeAddress,
          data.name,
          data.owners,
          data.threshold,
        ),
      )

      gtmSetChainId(chain.chainId)

      if (isCounterfactualEnabled && payMethod === PayMethod.PayLater) {
        await router?.push({
          pathname: AppRoutes.home,
          query: { safe: `${data.networks[0].shortName}:${safeAddress}` },
        })
        safeCreationDispatch(SafeCreationEvent.AWAITING_EXECUTION, {
          groupKey: CF_TX_GROUP_KEY,
          safeAddress,
          networks: data.networks,
        })
      }
    } catch (err) {
      console.error(err)
      setSubmitError('Error creating the Safe Account. Please try again later.')
    } finally {
      setIsCreating(false)
    }
  }

  const createSafe = async (chain: ChainInfo, props: ReplayedSafeProps, safeAddress: string) => {
    if (!wallet) return

    gtmSetChainId(chain.chainId)

    try {
      if (isCounterfactualEnabled && payMethod === PayMethod.PayLater) {
        gtmSetSafeAddress(safeAddress)

        trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: 'counterfactual', category: CREATE_SAFE_CATEGORY })
        replayCounterfactualSafeDeployment(chain.chainId, safeAddress, props, data.name, dispatch, payMethod)
        trackEvent({ ...CREATE_SAFE_EVENTS.CREATED_SAFE, label: 'counterfactual' })
        return
      }

      const options: DeploySafeProps['options'] = isEIP1559
        ? {
            maxFeePerGas: maxFeePerGas?.toString(),
            maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
            gasLimit: gasLimit?.toString(),
          }
        : { gasPrice: maxFeePerGas?.toString(), gasLimit: gasLimit?.toString() }

      const onSubmitCallback = async (taskId?: string, txHash?: string) => {
        // Create a counterfactual Safe
        replayCounterfactualSafeDeployment(chain.chainId, safeAddress, props, data.name, dispatch, payMethod)

        if (taskId) {
          safeCreationDispatch(SafeCreationEvent.RELAYING, { groupKey: CF_TX_GROUP_KEY, taskId, safeAddress })
        }

        if (txHash) {
          safeCreationDispatch(SafeCreationEvent.PROCESSING, {
            groupKey: CF_TX_GROUP_KEY,
            txHash,
            safeAddress,
          })
        }

        trackEvent(CREATE_SAFE_EVENTS.SUBMIT_CREATE_SAFE)
        trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: 'deployment', category: CREATE_SAFE_CATEGORY })

        onSubmit(data)
      }

      if (willRelay) {
        const taskId = await relaySafeCreation(chain, props)
        onSubmitCallback(taskId)
      } else {
        await createNewSafe(
          wallet.provider,
          props,
          data.safeVersion,
          chain,
          options,
          (txHash) => {
            onSubmitCallback(undefined, txHash)
          },
          true,
        )
      }
    } catch (_err) {
      const error = asError(_err)
      const submitError = isWalletRejection(error)
        ? 'User rejected signing.'
        : 'Error creating the Safe Account. Please try again later.'
      setSubmitError(submitError)

      if (isWalletRejection(error)) {
        trackEvent(CREATE_SAFE_EVENTS.REJECT_CREATE_SAFE)
      }
    }

    setIsCreating(false)
  }

  const showNetworkWarning =
    (isWrongChain && payMethod === PayMethod.PayNow && !willRelay && !isMultiChainDeployment) ||
    (isWrongChain && !isCounterfactualEnabled && !isMultiChainDeployment)

  return {
    handleCreateSafeClick,
    isCounterfactualEnabled,
    isMultiChainDeployment,
    chain,
    totalFee,
    canRelay,
    willRelay,
    walletCanPay,
    payMethod,
    setPayMethod,
    executionMethod,
    setExecutionMethod,
    minRelays,
    showNetworkWarning,
  }
}

export function Review({
  isCounterfactualEnabled,
  isMultiChainDeployment,
  chain,
  totalFee,
  canRelay,
  willRelay,
  walletCanPay,
  payMethod,
  setPayMethod,
  executionMethod,
  setExecutionMethod,
  minRelays,
  showNetworkWarning,
}: ReviewType) {
  return (
    <>
      {isCounterfactualEnabled ? (
        <Box data-testid="pay-now-later-message-box" className={layoutCss.row}>
          <PayNowPayLater
            totalFee={totalFee}
            isMultiChain={isMultiChainDeployment}
            canRelay={canRelay}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
          />

          {canRelay && payMethod === PayMethod.PayNow && (
            <>
              <Grid
                container
                spacing={3}
                sx={{
                  pt: 2,
                }}
              >
                <ReviewRow
                  value={
                    <ExecutionMethodSelector
                      executionMethod={executionMethod}
                      setExecutionMethod={setExecutionMethod}
                      relays={minRelays}
                    />
                  }
                />
              </Grid>
            </>
          )}

          {showNetworkWarning && (
            <Box sx={{ '&:not(:empty)': { mt: 3 } }}>
              <NetworkWarning action="create a Safe Account" />
            </Box>
          )}

          {payMethod === PayMethod.PayNow && (
            <Grid item>
              <Typography
                component="div"
                sx={{
                  mt: 2,
                }}
              >
                You will have to confirm a transaction and pay an estimated fee of{' '}
                <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} inline /> with your connected wallet
              </Typography>
            </Grid>
          )}
        </Box>
      ) : (
        <Box
          className={layoutCss.row}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
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
                  <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} />

                  {!willRelay && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mt: 1,
                      }}
                    >
                      You will have to confirm a transaction with your connected wallet.
                    </Typography>
                  )}
                </>
              }
            />
          </Grid>

          {showNetworkWarning && <NetworkWarning action="create a Safe Account" />}

          {!walletCanPay && !willRelay && (
            <ErrorMessage>
              Your connected wallet doesn&apos;t have enough funds to execute this transaction
            </ErrorMessage>
          )}
        </Box>
      )}
    </>
  )
}
