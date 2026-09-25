import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  type SafeItem,
  type SafeItems,
  type AllSafeItems,
  flattenSafeItems,
  useSafesSearch,
  getComparator,
  _groupAndSort,
  _buildSafeItem,
  useAllOwnedSafes,
} from '@/hooks/safes'
import AddManually, { type AddManuallyFormValues } from './AddManually'
import { getSafeId } from '../SelectSafesOnboarding/utils/safeIds'
import { applySafeSelectionToggle, getSelectedLeafKeys } from '../SelectSafesOnboarding/utils/selection'
import ExternalLink from '@/components/common/ExternalLink'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { useSimilarityClusters } from '@/features/address-poisoning'
import {
  ADDRESS_BOOK_UNAVAILABLE,
  getChainIdsParam,
  useCurrentSpaceId,
  useSpaceAddressBookState,
  useIsAdmin,
  useSpaceSafes,
  useUpsertWorkspaceSafeNames,
} from '@/features/spaces'
import {
  NameAccountsFields,
  buildWorkspaceSafeNames,
  getSafesToName,
  hasAllNames,
  touchNames,
  withWorkspaceNames,
} from '../NameAccounts'
import { AdminOnlyWorkspaceTooltip } from '../AdminOnlyWorkspaceTooltip'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useChains from '@/hooks/useChains'

import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
import { ArrowLeft, Info, Plus, Settings2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { SearchInput } from '@/components/ui/search-input'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import ManageTrustedSafesContent from '@/components/common/TrustedSafesModal/ManageTrustedSafesContent'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import Track from '@/components/common/Track'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { showNotification } from '@/store/notificationsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { cn } from '@/utils/cn'
import SelectedCounter, { safeLimitTooltip } from '../SelectedCounter'
import SafeLimitError from '../SelectedCounter/SafeLimitError'
import { useSpaceSafeLimit } from '../../hooks/useSpaceSafeLimit'
import { addressOfSafeKey, countSeats, isSpaceAtSafeLimit } from '@/utils/spaces'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'
import { seatsTooltip } from '../Plans/PlanStatusCard'
import { Link } from '@/components/ui/link'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../SelectSafesOnboarding/constants'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'
import { getSeatLimitMessage } from '../../utils/seatLimitError'

const PICKER_COLUMNS: SafeAccountColumnId[] = ['select', 'name', 'threshold', 'networks', 'balance']

const SCROLL_REGION_CLASS =
  'overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'

function getSelectedSafes(safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return Object.entries(safes).filter(
    ([key, isSelected]) =>
      isSelected &&
      !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX) &&
      !flatSafeItems.some((spaceSafe) => {
        const [chainId, address] = key.split(':')
        return spaceSafe.address === address && spaceSafe.chainId === chainId
      }),
  )
}

function getRemovedSafes(safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return flatSafeItems.filter((spaceSafe) => {
    const safeId = `${spaceSafe.chainId}:${spaceSafe.address}`
    return !safes[safeId]
  })
}

interface AddAccountsProps {
  buttonVariant?: 'outline' | 'default'
  buttonLabel?: string
  externalOpen?: boolean
  onExternalClose?: () => void
}

const AddAccounts = ({
  buttonVariant = 'outline',
  buttonLabel = 'Add accounts',
  externalOpen,
  onExternalClose,
}: AddAccountsProps = {}) => {
  const isAdmin = useIsAdmin()
  const [open, setOpen] = useState<boolean>(false)
  const isOpen = externalOpen ?? open
  const [view, setView] = useState<'select' | 'manage' | 'name'>('select')
  const [error, setError] = useState<string>()
  const [manualSafes, setManualSafes] = useState<SafeItems>([])
  const [safesToName, setSafesToName] = useState<AllSafeItems>([])
  const hasResetForOpen = useRef(false)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const dispatch = useAppDispatch()
  const { allSafes: spaceSafes, isLoading: isLoadingSpaceSafes } = useSpaceSafes()
  const sortComparator = getComparator(orderBy)
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()
  const [removeSafesFromSpace] = useSpaceSafesDeleteV1Mutation()
  const upsertWorkspaceNames = useUpsertWorkspaceSafeNames()
  const {
    items: spaceAddressBook,
    isLoading: isAddressBookLoading,
    isError: isAddressBookError,
  } = useSpaceAddressBookState()
  const spaceId = useCurrentSpaceId()
  const trustedModal = useTrustedSafesModal()

  // Get wallet and chain info
  const wallet = useWallet()
  const walletAddress = wallet?.address ?? ''
  const { configs } = useChains()
  const allChainIds = useMemo(() => configs.map((c) => c.chainId), [configs])

  // Get safe data. Only enumerate owned safes (the captcha-protected owners endpoint) once the modal
  // is open: the trusted list itself is built from added safes, so `allOwned` only feeds the per-row
  // read-only flag — which nothing needs while the dialog is closed and this trigger sits mounted.
  const [allOwned = {}] = useAllOwnedSafes(isOpen ? walletAddress : '')
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  // Build the trusted (pinned) safes list — owned safes are added by first trusting them via the
  // "Manage trusted Safes" view, then they appear here. Safes already in the workspace stay in the
  // list and open pre-checked (seeded by defaultSelectedSafes); unchecking one removes it.
  const trustedSafes = useMemo<AllSafeItems>(() => {
    const buildItem = (chainId: string, address: string) =>
      _buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)

    const trusted = allChainIds.flatMap((chainId) =>
      Object.keys(allAdded[chainId] || {}).map((address) => buildItem(chainId, address)),
    )

    return _groupAndSort(withWorkspaceNames([...trusted, ...manualSafes], spaceAddressBook), sortComparator)
  }, [
    allChainIds,
    allAdded,
    allOwned,
    allUndeployed,
    walletAddress,
    allVisitedSafes,
    allSafeNames,
    manualSafes,
    spaceAddressBook,
    sortComparator,
  ])

  const trustedSafeAddresses = useMemo(() => trustedSafes.map((s) => s.address), [trustedSafes])
  const { groupIdByAddress: similarityGroups } = useSimilarityClusters(trustedSafeAddresses)

  const [rawSearchQuery, setRawSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(rawSearchQuery, 300)
  const filteredTrusted = useSafesSearch(trustedSafes, debouncedSearchQuery)
  const visibleTrusted = debouncedSearchQuery ? filteredTrusted : trustedSafes

  // Build pre-checked safes from space safes
  const defaultSelectedSafes = useMemo(() => {
    const spaceSafeIds: Record<string, boolean> = {}
    const flatSpaceSafes = spaceSafes?.flatMap((item) => ('safes' in item ? item.safes : [item])) || []
    flatSpaceSafes.forEach((safe) => {
      const safeId = getSafeId(safe)
      spaceSafeIds[safeId] = true
    })
    return spaceSafeIds
  }, [spaceSafes])

  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: {
      selectedSafes: {},
      names: {},
    },
  })

  const { handleSubmit, watch, getValues, setValue, reset, formState } = formMethods

  const selectedSafes = watch(`selectedSafes`)
  const selectedSafesLength = getSelectedSafes(selectedSafes, spaceSafes).length
  const removedSafesCount = getRemovedSafes(selectedSafes, spaceSafes).length
  const isFormDirty = selectedSafesLength > 0 || removedSafesCount > 0
  const hasSomethingToSubmit = view === 'name' ? safesToName.length > 0 : isFormDirty
  const isAddressBookReady = !isAddressBookLoading && !isAddressBookError
  const submitError = error ?? (isAddressBookError ? ADDRESS_BOOK_UNAVAILABLE : undefined)
  const { isSubmitting } = formState

  // Not memoised: watch() returns the same object reference, so a useMemo on it would keep a stale Set.
  const selectedKeys = getSelectedLeafKeys(selectedSafes || {})

  // Checked Safes, one seat per address (workspace Safes are pre-checked and count toward the plan's cap).
  const seatCount = countSeats(Array.from(selectedKeys, addressOfSafeKey))
  const { limit, isError: isLimitError, retry: retryLimit } = useSpaceSafeLimit(spaceId)
  const isAtLimit = isSpaceAtSafeLimit(seatCount, limit)
  const isSelectionLocked = isAtLimit || limit === undefined
  const { isSafePro, tierName, plansHref } = useSeatUpsell(spaceId)
  const limitTooltip = isSafePro && typeof limit === 'number' ? seatsTooltip(tierName, limit) : safeLimitTooltip(limit)

  // Safes already in the workspace stay visible but locked: shown checked, dimmed, and not toggleable.
  const spaceSafeKeys = useMemo(
    () => new Set(flattenSafeItems(spaceSafes || []).map((safe) => `${safe.chainId}:${safe.address}`)),
    [spaceSafes],
  )

  const handleTableToggle = (line: AccountLine, nextChecked: boolean) =>
    applySafeSelectionToggle(setValue, visibleTrusted, selectedSafes || {}, line, nextChecked, spaceSafeKeys)

  // Reset form when modal opens. Wait until the space-safes query has resolved before seeding:
  // opening via the AddAccountsChooser on a cold cache can render with `spaceSafes` still empty, and
  // finalizing that empty seed would make Save diff every existing member as a removal (data loss).
  useEffect(() => {
    if (isOpen && !hasResetForOpen.current && !isLoadingSpaceSafes) {
      reset({ selectedSafes: defaultSelectedSafes, names: {} })
      hasResetForOpen.current = true
    } else if (!isOpen) {
      hasResetForOpen.current = false
    }
  }, [isOpen, defaultSelectedSafes, reset, isLoadingSpaceSafes])

  const onSubmit = handleSubmit(
    async (data) => {
      if (!isAdmin) {
        setError('Only admins can add or remove Safe accounts in this Workspace')
        return
      }

      const safesToAdd = getSelectedSafes(data.selectedSafes, spaceSafes).map(([key]) => {
        const [chainId, address] = key.split(':')
        return { chainId, address }
      })

      const safesToRemove = getRemovedSafes(data.selectedSafes, spaceSafes).map((safe) => ({
        chainId: safe.chainId,
        address: safe.address,
      }))

      const safesToWrite = view === 'select' ? getSafesToName(safesToAdd, trustedSafes, spaceAddressBook) : safesToName

      if (view === 'name' && !hasAllNames(data.names, safesToWrite)) {
        touchNames(getValues, setValue, safesToWrite)
        return
      }

      if (view === 'select' && safesToWrite.length > 0) {
        trackEvent(SPACE_EVENTS.NAME_ACCOUNTS_STEP, {
          [MixpanelEventParams.ACCOUNT_COUNT]: safesToWrite.length,
          [MixpanelEventParams.SOURCE]: SPACE_LABELS.add_accounts_modal,
        })
        setSafesToName(safesToWrite)
        setView('name')
        return
      }

      // Track event based on what action is being taken
      if (safesToAdd.length > 0) {
        trackEvent(SPACE_EVENTS.ADD_ACCOUNTS, {
          [MixpanelEventParams.ACCOUNT_COUNT]: safesToAdd.length,
          [MixpanelEventParams.SOURCE]: SPACE_LABELS.add_accounts_modal,
          [MixpanelEventParams.CHAIN_ID]: getChainIdsParam(safesToAdd),
        })
      }
      if (safesToRemove.length > 0) {
        trackEvent(SPACE_EVENTS.DELETE_ACCOUNT, {
          [MixpanelEventParams.ACCOUNT_COUNT]: safesToRemove.length,
          [MixpanelEventParams.CHAIN_ID]: getChainIdsParam(safesToRemove),
        })
      }

      try {
        // Add new safes
        if (safesToAdd.length > 0) {
          const result = await addSafesToSpace({
            spaceId: spaceId ?? '',
            createSpaceSafesDto: { safes: safesToAdd },
          })

          if (isElevationRequiredError(result.error)) return
          if (result.error) {
            const seatLimit = getSeatLimitMessage(result.error)
            if (seatLimit && spaceId) refreshSpaceEntitlements(dispatch, spaceId)
            const msg =
              seatLimit ??
              (getRtkQueryErrorMessage(result.error) || 'Something went wrong adding one or more Safe accounts.')
            setError(msg.replace(/:\s*Key\s*\(.*$/, ''))
            return
          }

          safesToAdd.forEach(({ chainId, address }) => {
            trackEvent(
              { ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId },
              { workspace_id: spaceId, safe_address: address, chain_id: chainId },
            )
          })
        }

        // Remove unchecked safes
        if (safesToRemove.length > 0) {
          const result = await removeSafesFromSpace({
            spaceId: spaceId ?? '',
            deleteSpaceSafesDto: { safes: safesToRemove },
          })

          if (isElevationRequiredError(result.error)) return
          if (result.error) {
            setError(
              getRtkQueryErrorMessage(result.error) || 'Something went wrong removing one or more Safe accounts.',
            )
            return
          }

          safesToRemove.forEach(({ chainId, address }) => {
            trackEvent(
              { ...SPACE_EVENTS.WORKSPACE_SAFE_UNLINKED, label: spaceId },
              { workspace_id: spaceId, safe_address: address, chain_id: chainId },
            )
          })
        }

        const namesResult = await upsertWorkspaceNames(buildWorkspaceSafeNames(data.names, safesToWrite))
        if (namesResult.error) {
          setError(namesResult.error)
          return
        }

        // Show success notification
        const messages = []
        if (safesToAdd.length > 0) messages.push(`Added ${safesToAdd.length} safe account(s)`)
        if (safesToRemove.length > 0) messages.push(`Removed ${safesToRemove.length} safe account(s)`)

        dispatch(
          showNotification({
            message: messages.length > 0 ? messages.join(' and ') : 'Safes updated',
            variant: 'success',
            groupKey: 'safe-account-update-success',
          }),
        )

        handleClose()
      } catch {
        setError('Something went wrong updating Safe accounts. Please try again.')
      }
    },
    () => touchNames(getValues, setValue, safesToName),
  )

  const handleAddSafe = (data: AddManuallyFormValues) => {
    const alreadyExists = trustedSafes.some((safe) => safe.address === data.address)

    const newSafeItem: SafeItem = {
      ...data,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: allSafeNames[data.chainId]?.[data.address] ?? '',
    }

    if (!alreadyExists) {
      setManualSafes((prev) => [newSafeItem, ...prev])
    }

    const safeId = getSafeId(newSafeItem)
    setValue(`selectedSafes.${safeId}`, true, { shouldValidate: true })
  }

  const handleOpenManage = () => {
    trustedModal.open()
    setRawSearchQuery('')
    setView('manage')
  }

  const handleBack = () => {
    trustedModal.close()
    setView('select')
  }

  const handleSaved = () => setView('select')

  const handleClose = () => {
    setError(undefined)
    setRawSearchQuery('')
    setManualSafes([])
    setValue('selectedSafes', {}) // Reset doesn't seem to work consistently with an object
    setValue('names', {})
    setSafesToName([])
    setView('select')
    trustedModal.close()
    setOpen(false)
    onExternalClose?.()
  }

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.add_accounts_modal })
    }
  }, [debouncedSearchQuery])

  const isListEmpty = trustedSafes.length === 0 && !debouncedSearchQuery
  const hasNoSearchMatch = visibleTrusted.length === 0 && Boolean(debouncedSearchQuery)
  const emptyStateMessage = wallet
    ? 'No accounts yet — add some via "Manage list", or add one by address below.'
    : 'No saved Safe accounts yet — add one by address below.'

  return (
    <>
      {externalOpen === undefined && (
        <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="bottom">
          <Button
            size="lg"
            className="font-normal"
            variant={buttonVariant}
            disabled={!isAdmin}
            onClick={() => {
              trackEvent(
                { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
                { workspace_id: spaceId, entry_point: 'dashboard' },
              )
              setOpen(true)
            }}
            data-testid="add-space-account-button"
          >
            <Plus
              className={cn('size-4', {
                'text-green-500': buttonVariant === 'default',
              })}
            />
            {buttonLabel}
          </Button>
        </AdminOnlyWorkspaceTooltip>
      )}

      <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
        {/* eslint-disable-next-line no-restricted-syntax -- bespoke full-height dialog layout preserved from dev's #8271 redesign */}
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
          {view === 'manage' ? (
            <>
              {/* eslint-disable-next-line no-restricted-syntax -- bespoke dialog header (back button row + divider) from dev's #8271 redesign */}
              <DialogHeader className="shrink-0 flex-row items-center gap-2 border-b border-border px-6 pb-4 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  aria-label="Back"
                  data-testid="manage-trusted-back"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <DialogTitle className="font-bold">Manage my account list</DialogTitle>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
                <ManageTrustedSafesContent
                  modal={trustedModal}
                  secondaryLabel="Back"
                  onSecondary={handleBack}
                  onSaved={handleSaved}
                />
              </div>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line no-restricted-syntax -- bespoke dialog header divider/padding from dev's #8271 redesign */}
              <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-center gap-2">
                  {view === 'name' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setView('select')}
                      aria-label="Back"
                      data-testid="name-accounts-back"
                    >
                      <ArrowLeft className="size-5" />
                    </Button>
                  )}
                  <DialogTitle className="font-bold">
                    {view === 'name' ? 'Name your Safe accounts' : 'My accounts'}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <FormProvider {...formMethods}>
                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
                  {view === 'name' ? (
                    <div className={cn(SCROLL_REGION_CLASS, 'min-h-0 flex-1')} data-testid="name-accounts-region">
                      <NameAccountsFields items={safesToName} />
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl bg-muted p-4">
                        <Info className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">What are my accounts?</p>
                          <p className="text-sm text-muted-foreground">
                            This list protects you from impersonation. Anyone can create a Safe account listing your
                            address as a signer, so only accounts you&apos;ve confirmed appear here.{' '}
                            <ExternalLink href={HELP_CENTER_URL} noIcon className="underline">
                              Learn more
                            </ExternalLink>
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenManage}
                          data-testid="open-manage-trusted-safes"
                          className="shrink-0"
                        >
                          <Settings2 className="size-4" />
                          Manage list
                        </Button>
                      </div>

                      {!isListEmpty && (
                        <div className="mb-3 flex shrink-0 items-center gap-3">
                          <SelectedCounter
                            count={seatCount}
                            limit={limit}
                            isAtLimit={isAtLimit}
                            tooltip={limitTooltip}
                          />
                          <SearchInput
                            className="flex-1"
                            placeholder="by name, address or network"
                            aria-label="Search Safe accounts by name, address or network"
                            autoComplete="off"
                            value={rawSearchQuery}
                            onChange={(e) => setRawSearchQuery(e.target.value)}
                            data-testid="add-accounts-search-input"
                          />
                        </div>
                      )}

                      <div
                        className={cn(SCROLL_REGION_CLASS, 'min-h-0 flex-1')}
                        data-testid="add-accounts-safes-list-region"
                      >
                        {isListEmpty ? (
                          <Typography variant="paragraph" align="center" color="muted" className="py-8">
                            {emptyStateMessage}
                          </Typography>
                        ) : hasNoSearchMatch ? (
                          <Typography variant="paragraph" align="center" color="muted" className="py-8">
                            No safes match your search
                          </Typography>
                        ) : (
                          <SafeAccountsTable
                            items={visibleTrusted}
                            columns={PICKER_COLUMNS}
                            similarityGroups={similarityGroups}
                            selection={{
                              selectedKeys,
                              onToggle: handleTableToggle,
                              isAtLimit: isSelectionLocked,
                              disabledKeys: spaceSafeKeys,
                              disabledReason: 'This safe is already part of your Workspace',
                            }}
                            data-testid="add-accounts-safes-table"
                          />
                        )}
                      </div>
                    </>
                  )}

                  {isLimitError && view === 'select' && (
                    <div className="mt-4">
                      <SafeLimitError onRetry={retryLimit} />
                    </div>
                  )}

                  {submitError && (
                    <Alert variant="destructive" className="mt-4 shrink-0">
                      <AlertSeverityIcon variant="destructive" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {isSafePro && isAtLimit && (
                    <Typography variant="paragraph-small" color="muted" align="center" className="mt-4 shrink-0">
                      Need more?{' '}
                      <Link href={plansHref} variant="muted" data-testid="compare-plans-link">
                        Compare plans
                      </Link>
                    </Typography>
                  )}

                  <div className="mt-4 flex shrink-0 flex-row items-center gap-3">
                    <div className="flex-1">
                      {view === 'name' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="lg"
                          onClick={() => setView('select')}
                          className="w-full"
                          data-testid="name-accounts-back-button"
                        >
                          Back
                        </Button>
                      ) : (
                        <Track {...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>
                          <AddManually handleAddSafe={handleAddSafe} disabled={isSelectionLocked} />
                        </Track>
                      )}
                    </div>

                    <Button
                      data-testid="add-accounts-button"
                      type="submit"
                      size="lg"
                      disabled={!hasSomethingToSubmit || !isAddressBookReady || isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        `Add accounts (${selectedSafesLength})`
                      )}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddAccounts
