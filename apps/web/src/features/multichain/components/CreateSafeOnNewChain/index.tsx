import NetworkInput from '@/components/common/NetworkInput'
import { updateAddressBook } from '@/components/new-safe/create/logic/address-book'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useAddressBook from '@/hooks/useAddressBook'
import { CREATE_SAFE_CATEGORY, CREATE_SAFE_EVENTS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { gtmSetChainId } from '@/services/analytics/gtm'
import { showNotification } from '@/store/notificationsSlice'
import { FormProvider, useForm } from 'react-hook-form'
import { useSafeCreationData } from '../../hooks/useSafeCreationData'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { hasMultiChainAddNetworkFeature, predictAddressBasedOnReplayData } from '../../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useRouter } from 'next/router'
import ChainIndicator from '@/components/common/ChainIndicator'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useEffect, useMemo, useState } from 'react'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { MULTICHAIN_HELP_ARTICLE } from '@/config/constants'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { AppRoutes, UNDEPLOYED_SAFE_BLOCKED_ROUTES } from '@/config/routes'
import type { CreateSafeOnNewChainForm, ReplaySafeDialogProps } from '../../types'
import { persistCounterfactualSafe } from '@/features/counterfactual/services'
import { isAuthenticated } from '@/store/authSlice'
import { useIsAdmin, useSpaceSafeCount, useSpaceSafeLimit } from '@/features/spaces'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { isSpaceAtSafeLimit } from '@/utils/spaces'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { CreateSafeOnNewChainView } from '@views/features/multichain/components/CreateSafeOnNewChain/CreateSafeOnNewChainView'

const ReplaySafeDialog = ({
  safeAddress,
  chain,
  currentName,
  open,
  onClose,
  safeCreationResult,
  replayableChains,
  isUnsupportedSafeCreationVersion,
}: ReplaySafeDialogProps) => {
  const formMethods = useForm<CreateSafeOnNewChainForm>({
    mode: 'all',
    defaultValues: {
      chainId: chain?.chainId || '',
    },
  })
  const { handleSubmit, formState, reset } = formMethods
  const router = useRouter()
  const addressBook = useAddressBook()

  const customRpc = useAppSelector(selectRpc)
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = useUrlSpaceId()
  const isAdminOfActiveSpace = useIsAdmin(spaceId ?? undefined)
  const spaceSafeCount = useSpaceSafeCount(spaceId)
  const { limit: spaceSafeLimit } = useSpaceSafeLimit(spaceId)
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserAuthenticated || spaceId === null },
  )
  // Seats are per address: another chain of a Safe already in the space takes none.
  const holdsSeatInSpace = Object.values(spaceSafes?.safes ?? {}).some((addresses) =>
    addresses.some((address) => sameAddress(address, safeAddress)),
  )
  const willStayOutsideSpace =
    isUserAuthenticated &&
    spaceId !== null &&
    isAdminOfActiveSpace &&
    !holdsSeatInSpace &&
    isSpaceAtSafeLimit(spaceSafeCount, spaceSafeLimit)
  const dispatch = useAppDispatch()
  const [creationError, setCreationError] = useState<Error>()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (chain?.chainId) {
      reset({ chainId: chain.chainId })
    }
  }, [chain?.chainId, reset])

  // Load some data
  const [safeCreationData, safeCreationDataError, safeCreationDataLoading] = safeCreationResult

  const onCancel = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CANCEL_ADD_NEW_NETWORK })
    onClose()
  }

  const onFormSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true)
    setCreationError(undefined)

    let hasError = false

    try {
      const selectedChain = chain ?? replayableChains?.find((config) => config.chainId === data.chainId)
      if (!safeCreationData || !selectedChain) {
        return
      }

      // We need to create a readOnly provider of the deployed chain
      const customRpcUrl = selectedChain ? customRpc?.[selectedChain.chainId] : undefined
      const provider = createWeb3ReadOnly(selectedChain, customRpcUrl)
      if (!provider) {
        return
      }

      // 1. Double check that the creation Data will lead to the correct address
      const predictedAddress = await predictAddressBasedOnReplayData(safeCreationData, provider)
      if (!sameAddress(safeAddress, predictedAddress)) {
        setCreationError(new Error('The replayed Safe leads to an unexpected address'))
        hasError = true
        return
      }

      gtmSetChainId(selectedChain.chainId)

      trackEvent({ ...OVERVIEW_EVENTS.SUBMIT_ADD_NEW_NETWORK, label: selectedChain.chainId })

      // 2. Persist to backend (if authenticated) + add to Redux. Shared code
      //    path with the initial create-safe flow so any future backend write
      //    added to one path is automatically covered for the other.
      const persistResult = await persistCounterfactualSafe({
        chainId: selectedChain.chainId,
        safeAddress,
        props: safeCreationData,
        name: currentName || '',
        payMethod: PayMethod.PayLater,
        spaceId,
        isUserAuthenticated,
        isAdminOfActiveSpace,
        spaceSafeCount,
        spaceSafeLimit,
        holdsSeatInSpace,
        provider,
        dispatch,
      })
      if (!persistResult.ok) {
        if (persistResult.stepUpPending) {
          // Nothing to show, but the dialog must not close as if the network had been added.
          hasError = true
          return
        }
        setCreationError(persistResult.error)
        hasError = true
        dispatch(
          showNotification({
            variant: 'error',
            groupKey: 'replay-safe-error',
            message: persistResult.error.message,
          }),
        )
        return
      }

      // Don't report a creation for Safes that were already deployed.
      if (persistResult.skipped !== 'already-deployed') {
        trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: 'counterfactual', category: CREATE_SAFE_CATEGORY })
        trackEvent({ ...CREATE_SAFE_EVENTS.CREATED_SAFE, label: 'counterfactual' })
      }

      router.push({
        pathname: UNDEPLOYED_SAFE_BLOCKED_ROUTES.includes(router.pathname) ? AppRoutes.home : router.pathname,
        query: {
          safe: `${selectedChain.shortName}:${safeAddress}`,
          ...(spaceId && { spaceId }),
        },
      })

      trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: selectedChain.chainId })

      dispatch(
        updateAddressBook(
          [selectedChain.chainId],
          safeAddress,
          currentName || '',
          safeCreationData.safeAccountConfig.owners.map((owner) => ({
            address: owner,
            name: addressBook[owner] || '',
          })),
          safeCreationData.safeAccountConfig.threshold,
        ),
      )

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'replay-safe-success',
          message:
            persistResult.skipped === 'already-deployed'
              ? `This account is already deployed on ${selectedChain.chainName}`
              : `Successfully added your account on ${selectedChain.chainName}`,
        }),
      )
    } catch (err) {
      console.error(err)
      setCreationError(err instanceof Error ? err : new Error('Failed to add the account on the selected network'))
      hasError = true
    } finally {
      setIsSubmitting(false)

      // Keep the dialog open on error so the inline message stays visible
      if (!hasError) {
        onClose()
      }
    }
  })

  const submitDisabled =
    isUnsupportedSafeCreationVersion ||
    !!safeCreationDataError ||
    safeCreationDataLoading ||
    !formState.isValid ||
    isSubmitting

  const noChainsAvailable =
    !chain && safeCreationData && replayableChains && replayableChains.filter((chain) => chain.available).length === 0

  return (
    <FormProvider {...formMethods}>
      <CreateSafeOnNewChainView
        open={open}
        onClose={onClose}
        onCancel={onCancel}
        onSubmit={onFormSubmit}
        chainIndicator={chain && <ChainIndicator chainId={chain.chainId} />}
        networkInput={
          !chain && (
            <NetworkInput
              required
              name="chainId"
              chainConfigs={(replayableChains as (Chain & { available: boolean })[]) ?? []}
            />
          )
        }
        willStayOutsideSpace={willStayOutsideSpace}
        spaceSafeLimit={spaceSafeLimit}
        safeCreationDataLoading={safeCreationDataLoading}
        safeCreationDataError={safeCreationDataError}
        isUnsupportedSafeCreationVersion={isUnsupportedSafeCreationVersion}
        noChainsAvailable={!!noChainsAvailable}
        creationError={creationError}
        isSubmitting={isSubmitting}
        submitDisabled={submitDisabled}
        helpArticleUrl={MULTICHAIN_HELP_ARTICLE}
        renderErrorMessage={(props) => <ErrorMessage {...props} />}
      />
    </FormProvider>
  )
}

export const CreateSafeOnNewChain = ({
  safeAddress,
  deployedChainIds,
  defaultChainId,
  ...props
}: Omit<
  ReplaySafeDialogProps,
  'safeCreationResult' | 'replayableChains' | 'chain' | 'isUnsupportedSafeCreationVersion'
> & {
  deployedChainIds: string[]
  defaultChainId?: string
}) => {
  const { configs } = useChains()
  const deployedChains = useMemo(
    () => configs.filter((config) => config.chainId === deployedChainIds[0]),
    [configs, deployedChainIds],
  )

  const safeCreationResult = useSafeCreationData(safeAddress, deployedChains)
  const allCompatibleChains = useCompatibleNetworks(safeCreationResult[0], configs)
  const isUnsupportedSafeCreationVersion = Boolean(!allCompatibleChains?.length)
  const replayableChains = useMemo(
    () =>
      allCompatibleChains?.filter(
        (config) => !deployedChainIds.includes(config.chainId) && hasMultiChainAddNetworkFeature(config),
      ) || [],
    [allCompatibleChains, deployedChainIds],
  )

  const preselectedChain = useMemo(
    () => (defaultChainId ? replayableChains?.find((c) => c.chainId === defaultChainId) : undefined),
    [defaultChainId, replayableChains],
  )

  return (
    <ReplaySafeDialog
      safeCreationResult={safeCreationResult}
      replayableChains={replayableChains}
      safeAddress={safeAddress}
      isUnsupportedSafeCreationVersion={isUnsupportedSafeCreationVersion}
      chain={preselectedChain}
      {...props}
    />
  )
}

export const CreateSafeOnSpecificChain = ({ ...props }: Omit<ReplaySafeDialogProps, 'replayableChains'>) => {
  return <ReplaySafeDialog {...props} isUnsupportedSafeCreationVersion={false} />
}
