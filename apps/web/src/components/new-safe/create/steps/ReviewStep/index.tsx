import type { NamedAddress } from '@/components/new-safe/create/types'
import EthHashInfo from '@/components/common/EthHashInfo'
import { safeCreationDispatch, SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import {
  computeNewSafeAddress,
  createNewSafe,
  createNewUndeployedSafeWithoutSalt,
  relaySafeCreation,
} from '@/components/new-safe/create/logic'
import { getAvailableSaltNonce } from '@/components/new-safe/create/logic/utils'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import PayNowPayLater, { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { CF_TX_GROUP_KEY, replayCounterfactualSafeDeployment } from '@/features/counterfactual/utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useGasPrice from '@/hooks/useGasPrice'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import { CREATE_SAFE_CATEGORY, CREATE_SAFE_EVENTS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { gtmSetChainId, gtmSetSafeAddress } from '@/services/analytics/gtm'
import { asError } from '@/services/exceptions/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { FEATURES, hasFeature } from '@/utils/chains'
import { hasRemainingRelays } from '@/utils/relaying'
import { isWalletRejection } from '@/utils/wallets'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, CircularProgress, Divider, Grid, Tooltip, Typography } from '@mui/material'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import NetworkWarning from '../../NetworkWarning'
import useAllSafes from '@/features/myAccounts/hooks/useAllSafes'
import uniq from 'lodash/uniq'
import { selectRpc } from '@/store/settingsSlice'
import { AppRoutes } from '@/config/routes'
import { type ReplayedSafeProps } from '@/store/slices'
import { predictAddressBasedOnReplayData } from '@/features/multichain/utils/utils'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/hooks/wallets/web3'
import { type DeploySafeProps } from '@safe-global/protocol-kit'
import { updateAddressBook } from '../../logic/address-book'
import chains from '@/config/chains'

export const NetworkFee = ({
  totalFee,
  chain,
  isWaived,
  inline = false,
}: {
  totalFee: string
  chain: ChainInfo | undefined
  isWaived: boolean
  inline?: boolean
}) => {
  return (
    <Box className={classnames(css.networkFee, { [css.networkFeeInline]: inline })}>
      <Typography className={classnames({ [css.strikethrough]: isWaived })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </Box>
  )
}

export const SafeSetupOverview = ({
  name,
  owners,
  threshold,
  networks,
}: {
  name?: string
  owners: NamedAddress[]
  threshold: number
  networks: ChainInfo[]
}) => {
  return (
    <Grid container spacing={3}>
      <ReviewRow
        name={networks.length > 1 ? 'Networks' : 'Network'}
        value={
          <Tooltip
            title={
              <Box>
                {networks.map((safeItem) => (
                  <Box
                    key={safeItem.chainId}
                    sx={{
                      p: '4px 0px',
                    }}
                  >
                    <ChainIndicator chainId={safeItem.chainId} />
                  </Box>
                ))}
              </Box>
            }
            arrow
          >
            <Box
              data-testid="network-list"
              sx={{
                display: 'inline-block',
              }}
            >
              <NetworkLogosList networks={networks} />
            </Box>
          </Tooltip>
        }
      />
      {name && <ReviewRow name="Name" value={<Typography data-testid="review-step-safe-name">{name}</Typography>} />}
      <ReviewRow
        name="Signers"
        value={
          <Box data-testid="review-step-owner-info" className={css.ownersArray}>
            {owners.map((owner, index) => (
              <EthHashInfo
                address={owner.address}
                name={owner.name || owner.ens}
                shortAddress={false}
                showPrefix={false}
                showName
                hasExplorer
                showCopyButton
                key={index}
              />
            ))}
          </Box>
        }
      />
      <ReviewRow
        name="Threshold"
        value={
          <Typography data-testid="review-step-threshold">
            {threshold} out of {owners.length} {owners.length > 1 ? 'signers' : 'signer'}
          </Typography>
        }
      />
    </Grid>
  )
}

const ReviewStep = ({ data, onSubmit, onBack, setStep }: StepRenderProps<NewSafeFormData>) => {
  const isWrongChain = useIsWrongChain()
  useSyncSafeCreationStep(setStep, data.networks)
  const chain = useCurrentChain()
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [gasPrice] = useGasPrice()
  const customRpc = useAppSelector(selectRpc)
  const [payMethod, setPayMethod] = useState(PayMethod.PayLater)
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>()
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

  const handleBack = () => {
    onBack(data)
  }

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

  const isDisabled = showNetworkWarning || isCreating

  return (
    <>
      <Box data-testid="safe-setup-overview" className={layoutCss.row}>
        <SafeSetupOverview name={data.name} owners={data.owners} threshold={data.threshold} networks={data.networks} />
      </Box>
      {isCounterfactualEnabled && (
        <>
          <Divider />
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
                  <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} inline /> with your connected
                  wallet
                </Typography>
              </Grid>
            )}
          </Box>
        </>
      )}
      {!isCounterfactualEnabled && (
        <>
          <Divider />
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
        </>
      )}
      <Divider />
      <Box className={layoutCss.row}>
        {submitError && <ErrorMessage className={css.errorMessage}>{submitError}</ErrorMessage>}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Button
            data-testid="back-btn"
            variant="outlined"
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBackIcon fontSize="small" />}
          >
            Back
          </Button>
          <Button
            data-testid="review-step-next-btn"
            onClick={handleCreateSafeClick}
            variant="contained"
            size="stretched"
            disabled={isDisabled}
          >
            {isCreating ? <CircularProgress size={18} /> : 'Create account'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default ReviewStep
