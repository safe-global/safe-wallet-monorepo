import ModalDialog from '@/components/common/ModalDialog'
import NetworkInput from '@/components/common/NetworkInput'
import { updateAddressBook } from '@/components/new-safe/create/logic/address-book'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useAddressBook from '@/hooks/useAddressBook'
import { CREATE_SAFE_CATEGORY, CREATE_SAFE_EVENTS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { gtmSetChainId } from '@/services/analytics/gtm'
import { showNotification } from '@/store/notificationsSlice'
import { Box, Button, CircularProgress, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { useSafeCreationData } from '../../hooks/useSafeCreationData'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { hasMultiChainAddNetworkFeature, predictAddressBasedOnReplayData } from '../../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ExternalLink from '@/components/common/ExternalLink'
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
import { isAuthenticated, lastUsedSpace } from '@/store/authSlice'
import { useIsAdmin, useSpaceSafeCount } from '@/features/spaces'
import { normalizeSpaceId } from '@/utils/spaces'

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
  const spaceId = useAppSelector(lastUsedSpace)
  const isAdminOfActiveSpace = useIsAdmin(normalizeSpaceId(spaceId) ?? undefined)
  const spaceSafeCount = useSpaceSafeCount(spaceId)
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
        provider,
        dispatch,
      })
      if (!persistResult.ok) {
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
    <ModalDialog open={open} onClose={onClose} dialogTitle="Add another network" hideChainIndicator>
      <form onSubmit={onFormSubmit} id="recreate-safe">
        <DialogContent data-testid="add-chain-dialog">
          <FormProvider {...formMethods}>
            <Stack spacing={2}>
              <Typography>Add this Safe to another network with the same address.</Typography>

              {chain && (
                <Box
                  data-testid="added-network"
                  sx={{
                    p: 2,
                    backgroundColor: 'background.main',
                    borderRadius: '6px',
                  }}
                >
                  <ChainIndicator chainId={chain.chainId} />
                </Box>
              )}

              <ErrorMessage level="info">
                The Safe will use the initial setup of the copied Safe. Any changes to owners, threshold, modules or the
                Safe&apos;s version will not be reflected in the copy.
              </ErrorMessage>

              {safeCreationDataLoading ? (
                <Stack
                  direction="column"
                  sx={{
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress />
                  <Typography variant="body2">Loading Safe data</Typography>
                </Stack>
              ) : safeCreationDataError ? (
                <ErrorMessage error={safeCreationDataError} level="error">
                  Could not determine the Safe creation parameters.
                </ErrorMessage>
              ) : isUnsupportedSafeCreationVersion ? (
                <ErrorMessage>
                  This account was created from an outdated mastercopy. Adding another network is not possible.
                </ErrorMessage>
              ) : noChainsAvailable ? (
                <ErrorMessage level="error">This Safe cannot be replayed on any chains.</ErrorMessage>
              ) : (
                <>
                  {!chain && (
                    <NetworkInput
                      required
                      name="chainId"
                      chainConfigs={(replayableChains as (Chain & { available: boolean })[]) ?? []}
                    />
                  )}
                </>
              )}

              {creationError && (
                <ErrorMessage error={creationError} level="error">
                  {creationError.message || 'The Safe could not be created with the same address.'}
                </ErrorMessage>
              )}
            </Stack>
          </FormProvider>
        </DialogContent>
        <DialogActions>
          {isUnsupportedSafeCreationVersion ? (
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ExternalLink sx={{ flexGrow: 1 }} href={MULTICHAIN_HELP_ARTICLE}>
                Read more
              </ExternalLink>
              <Button variant="contained" onClick={onClose}>
                Got it
              </Button>
            </Box>
          ) : (
            <>
              <Button onClick={onCancel}>Cancel</Button>
              <Button data-testid="modal-add-network-btn" type="submit" variant="contained" disabled={submitDisabled}>
                {isSubmitting ? <CircularProgress size={20} /> : 'Add network'}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </ModalDialog>
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
