import type { NamedAddress } from '@/components/new-safe/create/types'
import EthHashInfo from '@/components/common/EthHashInfo'
import {
  safeCreationDispatch,
  SafeCreationEvent,
  replayCounterfactualSafeDeployment,
  activateReplayedSafe,
  persistCounterfactualSafe,
} from '@/features/counterfactual/services'
import { CF_TX_GROUP_KEY, PayNowPayLater } from '@/features/counterfactual'
import { NetworkLogosList, predictAddressBasedOnReplayData } from '@/features/multichain'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import {
  createNewSafe,
  createNewUndeployedSafeWithoutSalt,
  relaySafeCreation,
} from '@/components/new-safe/create/logic'
import { getAvailableSaltNonce } from '@/components/new-safe/create/logic/utils'
import {
  buildTransactionOptions,
  getDeploymentType,
  getEffectivePayMethod,
  getNetworkLabel,
  getPaymentMethodLabel,
  getThresholdLabel,
  getWillRelay,
  shouldShowNetworkWarning,
} from '@/components/new-safe/create/steps/ReviewStep/utils'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod, ExecutionMethodSelector } from '@/components/tx/ExecutionMethodSelector'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useGasPrice from '@/hooks/useGasPrice'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'
import {
  CREATE_SAFE_CATEGORY,
  CREATE_SAFE_EVENTS,
  OVERVIEW_EVENTS,
  trackEvent,
  MixpanelEventParams,
} from '@/services/analytics'
import { gtmSetChainId, gtmSetSafeAddress } from '@/services/analytics/gtm'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { hasRemainingRelays } from '@/utils/relaying'
import { isWalletRejection } from '@/utils/wallets'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import NetworkWarning from '../../NetworkWarning'
import { useAllSafes } from '@/hooks/safes'
import uniq from 'lodash/uniq'
import { selectRpc } from '@/store/settingsSlice'
import { isAuthenticated, lastUsedSpace } from '@/store/authSlice'
import { useIsAdmin, useSpaceSafeCount } from '@/features/spaces'
import { normalizeSpaceId } from '@/utils/spaces'
import { AppRoutes } from '@/config/routes'
import type { CreateSafeResult, ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { updateAddressBook } from '../../logic/address-book'
import {
  FEATURES,
  hasFeature,
  getNativeTokenDisplay,
  NATIVE_TOKEN_DISPLAY_DEFAULT,
} from '@safe-global/utils/utils/chains'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { type TransactionOptions } from '@safe-global/types-kit'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'

export const NetworkFee = ({
  totalFee,
  chain,
  isWaived,
  inline = false,
}: {
  totalFee: string
  chain: Chain | undefined
  isWaived: boolean
  inline?: boolean
}) => {
  return (
    <div className={classnames(css.networkFee, { [css.networkFeeInline]: inline })}>
      <Typography className={classnames({ [css.strikethrough]: isWaived })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </div>
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
  networks: Chain[]
}) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      <ReviewRow
        name={getNetworkLabel(networks.length)}
        value={
          <Tooltip>
            <TooltipTrigger
              render={
                <span data-testid="network-list" className="inline-block">
                  <NetworkLogosList networks={networks} />
                </span>
              }
            />
            <TooltipContent>
              <div>
                {networks.map((safeItem) => (
                  <div key={safeItem.chainId} className="py-1">
                    <ChainIndicator chainId={safeItem.chainId} />
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        }
      />
      {name && <ReviewRow name="Name" value={<Typography data-testid="review-step-safe-name">{name}</Typography>} />}
      <ReviewRow
        name="Signers"
        value={
          <div data-testid="review-step-owner-info" className={css.ownersArray}>
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
          </div>
        }
      />
      <ReviewRow
        name="Threshold"
        value={
          <Typography data-testid="review-step-threshold">{getThresholdLabel(threshold, owners.length)}</Typography>
        }
      />
    </div>
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
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = useAppSelector(lastUsedSpace)
  const isAdminOfActiveSpace = useIsAdmin(normalizeSpaceId(spaceId) ?? undefined)
  const spaceSafeCount = useSpaceSafeCount(spaceId)
  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)
  const { showGasFeeEstimation, showInsufficientFundsWarning, showFeeInConfirmationText } = chain
    ? getNativeTokenDisplay(chain)
    : NATIVE_TOKEN_DISPLAY_DEFAULT

  const ownerAddresses = useMemo(() => data.owners.map((owner) => owner.address), [data.owners])
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  const isMultiChainDeployment = data.networks.length > 1

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = getWillRelay(canRelay, executionMethod)

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

  // Derive effective pay method synchronously to avoid one-render gap.
  const effectivePayMethod = getEffectivePayMethod(
    isMultiChainDeployment,
    isUserAuthenticated,
    payMethod,
    isCounterfactualEnabled,
  )

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

      const safeAddress = await predictAddressBasedOnReplayData(replayedSafeWithNonce, provider)

      const createSafeResults: CreateSafeResult[] = []
      for (const network of data.networks) {
        const result = await createSafe(network, replayedSafeWithNonce, safeAddress)
        createSafeResults.push(result)
      }

      // Update the addressbook with owners and Safe on all successfully created networks
      const successfulChains = createSafeResults.filter((result) => result.success)
      if (successfulChains.length > 0) {
        dispatch(
          updateAddressBook(
            successfulChains.map((res) => res.chain.chainId),
            safeAddress,
            data.name,
            data.owners,
            data.threshold,
          ),
        )
      }

      gtmSetChainId(chain.chainId)

      if (isCounterfactualEnabled && effectivePayMethod === PayMethod.PayLater) {
        if (successfulChains.length === 0) return

        await router?.push({
          pathname: AppRoutes.home,
          query: { safe: `${successfulChains[0].chain.shortName}:${safeAddress}` },
        })
        safeCreationDispatch(SafeCreationEvent.AWAITING_EXECUTION, {
          groupKey: CF_TX_GROUP_KEY,
          safeAddress,
          networks: successfulChains.map((r) => r.chain),
        })
      }
    } catch (err) {
      console.error(err)
      setSubmitError('Error creating the Safe account. Please try again later.')
    } finally {
      setIsCreating(false)
    }
  }

  const createSafe = async (chain: Chain, props: ReplayedSafeProps, safeAddress: string): Promise<CreateSafeResult> => {
    if (!wallet) return { chain, safeAddress, success: false }

    gtmSetChainId(chain.chainId)

    trackEvent(CREATE_SAFE_EVENTS.CREATED_SAFE, {
      [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
      [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chain.chainName,
      [MixpanelEventParams.NUMBER_OF_OWNERS]: props.safeAccountConfig.owners.length,
      [MixpanelEventParams.THRESHOLD]: props.safeAccountConfig.threshold,
      [MixpanelEventParams.ENTRY_POINT]: document.referrer || 'Direct',
      [MixpanelEventParams.DEPLOYMENT_TYPE]: getDeploymentType(isCounterfactualEnabled, effectivePayMethod),
      [MixpanelEventParams.PAYMENT_METHOD]: getPaymentMethodLabel(
        isCounterfactualEnabled,
        effectivePayMethod,
        willRelay,
      ),
    })

    try {
      if (isCounterfactualEnabled && effectivePayMethod === PayMethod.PayLater) {
        gtmSetSafeAddress(safeAddress)

        trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: 'counterfactual', category: CREATE_SAFE_CATEGORY })

        // Single code path for backend persist + Redux add — shared with the
        // "Add another network" flow to keep the write path consistent.
        const result = await persistCounterfactualSafe({
          chainId: chain.chainId,
          safeAddress,
          props,
          name: data.name,
          payMethod: effectivePayMethod,
          spaceId,
          isUserAuthenticated,
          isAdminOfActiveSpace,
          spaceSafeCount,
          isMultiChainCreation: isMultiChainDeployment,
          dispatch,
        })
        if (!result.ok) throw result.error

        return { chain, safeAddress, success: true }
      }

      const options: TransactionOptions = buildTransactionOptions(
        !!isEIP1559,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
      )

      const onSubmitCallback = async (taskId?: string, txHash?: string) => {
        // Create a counterfactual Safe
        replayCounterfactualSafeDeployment(chain.chainId, safeAddress, props, data.name, dispatch, effectivePayMethod)

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
          chain,
          options,
          (txHash) => {
            onSubmitCallback(undefined, txHash)
          },
          true,
          activateReplayedSafe,
        )
      }
    } catch (_err) {
      const error = asError(_err)
      const submitError = isWalletRejection(error)
        ? 'User rejected signing.'
        : 'Error creating the Safe account. Please try again later.'
      setSubmitError(submitError)

      if (isWalletRejection(error)) {
        trackEvent(CREATE_SAFE_EVENTS.REJECT_CREATE_SAFE)
      }

      return { chain, safeAddress, success: false }
    }

    return { chain, safeAddress, success: true }
  }

  const showNetworkWarning = shouldShowNetworkWarning(
    isWrongChain,
    effectivePayMethod,
    willRelay,
    isMultiChainDeployment,
    isCounterfactualEnabled,
  )

  // Pay later persists counterfactual data to the backend, so it requires an
  // authenticated session. This only blocks multichain (where Pay now is
  // disabled and Pay later is forced); single-chain Pay later falls back to
  // Pay now when not signed in, so effectivePayMethod is never PayLater there.
  const requiresSignIn = effectivePayMethod === PayMethod.PayLater && !isUserAuthenticated
  const isDisabled = showNetworkWarning || isCreating || requiresSignIn

  return (
    <>
      <div data-testid="safe-setup-overview" className={layoutCss.row}>
        <SafeSetupOverview name={data.name} owners={data.owners} threshold={data.threshold} networks={data.networks} />
      </div>
      {isCounterfactualEnabled && (
        <>
          <Separator />
          <div data-testid="pay-now-later-message-box" className={layoutCss.row}>
            <PayNowPayLater
              totalFee={totalFee}
              canRelay={willRelay}
              isMultiChain={isMultiChainDeployment}
              payMethod={effectivePayMethod}
              setPayMethod={setPayMethod}
              isUserAuthenticated={isUserAuthenticated}
            />

            {canRelay && effectivePayMethod === PayMethod.PayNow && (
              <div className="grid grid-cols-12 gap-6 pt-4">
                <ReviewRow
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

            {showNetworkWarning && (
              <div className="mt-6">
                <NetworkWarning action="create a Safe account" />
              </div>
            )}

            {effectivePayMethod === PayMethod.PayNow && (
              <div className="mt-4">
                <Typography>
                  {!showFeeInConfirmationText ? (
                    'You will have to confirm a transaction with your connected wallet'
                  ) : (
                    <>
                      You will have to confirm a transaction and pay an estimated fee of{' '}
                      <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} inline /> with your connected
                      wallet
                    </>
                  )}
                </Typography>
              </div>
            )}
          </div>
        </>
      )}
      {!isCounterfactualEnabled && (
        <>
          <Separator />
          <div className={`${layoutCss.row} flex flex-col gap-6`}>
            {canRelay && (
              <div className="grid grid-cols-12 gap-6">
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
              <div data-testid="network-fee-section" className="grid grid-cols-12 gap-6">
                <ReviewRow
                  name="Est. network fee"
                  value={
                    <>
                      <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} />

                      {!willRelay && (
                        <Typography variant="paragraph-small" className="mt-2 block text-[var(--color-text-secondary)]">
                          You will have to confirm a transaction with your connected wallet.
                        </Typography>
                      )}
                    </>
                  }
                />
              </div>
            )}

            {showNetworkWarning && <NetworkWarning action="create a Safe account" />}

            {!walletCanPay && !willRelay && showInsufficientFundsWarning && (
              <ErrorMessage>
                Your connected wallet doesn&apos;t have enough funds to execute this transaction
              </ErrorMessage>
            )}
          </div>
        </>
      )}
      <Separator />
      <div className={layoutCss.row}>
        {submitError && <ErrorMessage className={css.errorMessage}>{submitError}</ErrorMessage>}
        <div className="flex flex-row justify-between gap-6">
          <Button data-testid="back-btn" variant="outline" size="lg" onClick={handleBack}>
            <ArrowBackIcon className="size-4" />
            Back
          </Button>
          <Button
            data-testid="review-step-next-btn"
            onClick={handleCreateSafeClick}
            variant="default"
            size="lg"
            disabled={isDisabled}
          >
            {isCreating ? <Spinner className="size-[18px]" /> : 'Create account'}
          </Button>
        </div>
      </div>
    </>
  )
}

export default ReviewStep
