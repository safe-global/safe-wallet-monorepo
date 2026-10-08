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
import { getSafeId } from '@views/features/spaces/components/SelectSafesOnboarding/utils/safeIds'
import { applySafeSelectionToggle, getSelectedLeafKeys } from '../SelectSafesOnboarding/utils/selection'
import { useSimilarityClusters } from '@/features/address-poisoning'
import {
  ADDRESS_BOOK_UNAVAILABLE,
  getChainIdsParam,
  useCurrentSpaceId,
  useSpaceAddressBookState,
  useIsAdmin,
  useSpaceSafes,
  usePrepareWorkspaceSafeNames,
} from '@/features/spaces'
import {
  NameAccountsFields,
  buildWorkspaceSafeNames,
  getSafesToName,
  hasAllNames,
  touchNames,
  withWorkspaceNames,
} from '../NameAccounts'
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
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import ManageTrustedSafesContent from '@/components/common/TrustedSafesModal/ManageTrustedSafesContent'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { showNotification } from '@/store/notificationsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafeLimit } from '../../hooks/useSpaceSafeLimit'
import { addressOfSafeKey, countSeats, isSpaceAtSafeLimit } from '@/utils/spaces'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '@views/features/spaces/components/SelectSafesOnboarding/constants'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'
import { getSeatLimitMessage } from '../../utils/seatLimitError'
import { AddAccountsView } from '@views/features/spaces/components/AddAccounts/AddAccountsView'

const PICKER_COLUMNS: SafeAccountColumnId[] = ['select', 'name', 'threshold', 'networks', 'balance']

function getSelectedSafes(safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return Object.entries(safes)
    .filter(
      ([key, isSelected]) =>
        isSelected &&
        !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX) &&
        !flatSafeItems.some((spaceSafe) => {
          const [chainId, address] = key.split(':')
          return spaceSafe.address === address && spaceSafe.chainId === chainId
        }),
    )
    .map(([key]) => {
      const [chainId, address] = key.split(':')
      return { chainId, address }
    })
}

const countSafeAccounts = (safes: Array<{ address: string }>) => countSeats(safes.map(({ address }) => address))

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
  const prepareNames = usePrepareWorkspaceSafeNames()
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
  const newSafes = getSelectedSafes(selectedSafes, spaceSafes)
  const removedSafesCount = getRemovedSafes(selectedSafes, spaceSafes).length
  const isFormDirty = newSafes.length > 0 || removedSafesCount > 0
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

      const safesToAdd = getSelectedSafes(data.selectedSafes, spaceSafes)

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

      const preparedNames = prepareNames(buildWorkspaceSafeNames(data.names, safesToWrite))
      if (preparedNames.error !== undefined) {
        setError(preparedNames.error)
        return
      }

      try {
        // Add new Safes and their names
        if (safesToAdd.length > 0) {
          const result = await addSafesToSpace({
            spaceId: spaceId ?? '',
            createSpaceSafesDto: { safes: safesToAdd, addressBookItems: preparedNames.items },
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

        // Show success notification
        const messages = []
        if (safesToAdd.length > 0) messages.push(`Added ${countSafeAccounts(safesToAdd)} safe account(s)`)
        if (safesToRemove.length > 0) messages.push(`Removed ${countSafeAccounts(safesToRemove)} safe account(s)`)

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
  return (
    <FormProvider {...formMethods}>
      <AddAccountsView
        showTrigger={externalOpen === undefined}
        isAdmin={isAdmin}
        buttonVariant={buttonVariant}
        buttonLabel={buttonLabel}
        onTriggerClick={() => {
          trackEvent(
            { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
            { workspace_id: spaceId, entry_point: 'dashboard' },
          )
          setOpen(true)
        }}
        isOpen={isOpen}
        onOpenChange={(next) => !next && handleClose()}
        view={view}
        onManageBack={handleBack}
        renderManageContent={(props) => (
          <ManageTrustedSafesContent {...props} modal={trustedModal} onSecondary={handleBack} onSaved={handleSaved} />
        )}
        onSelectStep={() => setView('select')}
        onSubmit={onSubmit}
        nameFields={<NameAccountsFields items={safesToName} />}
        onOpenManage={handleOpenManage}
        isListEmpty={isListEmpty}
        hasNoSearchMatch={hasNoSearchMatch}
        hasWallet={Boolean(wallet)}
        seatCount={seatCount}
        limit={limit}
        isAtLimit={isAtLimit}
        isSafePro={isSafePro}
        tierName={tierName}
        searchQuery={rawSearchQuery}
        onSearchQueryChange={setRawSearchQuery}
        renderSafesTable={({ disabledReason }) => (
          <SafeAccountsTable
            items={visibleTrusted}
            columns={PICKER_COLUMNS}
            similarityGroups={similarityGroups}
            selection={{
              selectedKeys,
              onToggle: handleTableToggle,
              isAtLimit: isSelectionLocked,
              disabledKeys: spaceSafeKeys,
              disabledReason,
            }}
            data-testid="add-accounts-safes-table"
          />
        )}
        isLimitError={isLimitError}
        onRetryLimit={retryLimit}
        submitError={submitError}
        plansHref={plansHref}
        addManually={<AddManually handleAddSafe={handleAddSafe} disabled={isSelectionLocked} />}
        submitDisabled={!hasSomethingToSubmit || !isAddressBookReady || isSubmitting}
        isSubmitting={isSubmitting}
      />
    </FormProvider>
  )
}

export default AddAccounts
