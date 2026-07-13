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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { useCurrentSpaceId, useIsAdmin, useSpaceSafes } from '@/features/spaces'
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
import { ArrowLeft, Info, Search, Plus, Settings2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import ManageTrustedSafesContent from '@/components/common/TrustedSafesModal/ManageTrustedSafesContent'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import Track from '@/components/common/Track'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { cn } from '@/utils/cn'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/constants'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../SelectSafesOnboarding/constants'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'

const PICKER_COLUMNS: SafeAccountColumnId[] = ['select', 'name', 'threshold', 'networks', 'balance']

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
  const [view, setView] = useState<'select' | 'manage'>('select')
  const [error, setError] = useState<string>()
  const [manualSafes, setManualSafes] = useState<SafeItems>([])
  const hasResetForOpen = useRef(false)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const dispatch = useAppDispatch()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const sortComparator = getComparator(orderBy)
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()
  const [removeSafesFromSpace] = useSpaceSafesDeleteV1Mutation()
  const spaceId = useCurrentSpaceId()
  const trustedModal = useTrustedSafesModal()

  // Get wallet and chain info
  const wallet = useWallet()
  const walletAddress = wallet?.address ?? ''
  const { configs } = useChains()
  const allChainIds = useMemo(() => configs.map((c) => c.chainId), [configs])

  // Get safe data
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
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

    return _groupAndSort([...trusted, ...manualSafes], sortComparator)
  }, [
    allChainIds,
    allAdded,
    allOwned,
    allUndeployed,
    walletAddress,
    allVisitedSafes,
    allSafeNames,
    manualSafes,
    sortComparator,
  ])

  const similarAddresses = useMemo<Set<string>>(
    () => getFlaggedSimilarAddressSet(trustedSafes.map((s) => s.address)),
    [trustedSafes],
  )

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
    },
  })

  const { handleSubmit, watch, setValue, reset, formState } = formMethods

  const selectedSafes = watch(`selectedSafes`)
  const selectedSafesLength = getSelectedSafes(selectedSafes, spaceSafes).length
  const removedSafesCount = getRemovedSafes(selectedSafes, spaceSafes).length
  const isFormDirty = selectedSafesLength > 0 || removedSafesCount > 0
  const { isSubmitting } = formState

  // Computed inline (not memoised): react-hook-form's watch() mutates and returns the same object
  // reference, so a useMemo keyed on `selectedSafes` would keep a stale Set and the checkboxes would
  // never re-render even though the form value (and the footer counter) changed.
  const selectedKeys = getSelectedLeafKeys(selectedSafes || {})

  // Total checked safes (workspace safes are pre-checked and count toward the per-workspace cap).
  const isAtLimit = selectedKeys.size >= SAFE_ACCOUNTS_LIMIT

  // Safes already in the workspace stay visible but locked: shown checked, dimmed, and not toggleable.
  const spaceSafeKeys = useMemo(
    () => new Set(flattenSafeItems(spaceSafes || []).map((safe) => `${safe.chainId}:${safe.address}`)),
    [spaceSafes],
  )

  const handleTableToggle = (line: AccountLine, nextChecked: boolean) =>
    applySafeSelectionToggle(setValue, visibleTrusted, selectedSafes || {}, line, nextChecked)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !hasResetForOpen.current) {
      reset({ selectedSafes: defaultSelectedSafes })
      hasResetForOpen.current = true
    } else if (!isOpen) {
      hasResetForOpen.current = false
    }
  }, [isOpen, defaultSelectedSafes, reset])

  const onSubmit = handleSubmit(async (data) => {
    if (!isAdmin) {
      setError('Only admins can add or remove Safe accounts in this workspace')
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

    // Track event based on what action is being taken
    if (safesToAdd.length > 0) {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })
    }
    if (safesToRemove.length > 0) {
      trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT })
    }

    try {
      // Add new safes
      if (safesToAdd.length > 0) {
        const result = await addSafesToSpace({
          spaceId: spaceId ?? '',
          createSpaceSafesDto: { safes: safesToAdd },
        })

        if (result.error) {
          const msg = getRtkQueryErrorMessage(result.error) || 'Something went wrong adding one or more Safe accounts.'
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

        if (result.error) {
          setError(getRtkQueryErrorMessage(result.error) || 'Something went wrong removing one or more Safe accounts.')
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
  })

  const handleAddSafe = (data: AddManuallyFormValues) => {
    const alreadyExists = trustedSafes.some((safe) => safe.address === data.address)

    const newSafeItem: SafeItem = {
      ...data,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: '',
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
            className="font-normal px-4 py-0"
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
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
          {view === 'manage' ? (
            <>
              <DialogHeader className="shrink-0 flex-row items-center gap-2 border-b border-border px-6 pb-4 pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Back"
                  data-testid="manage-trusted-back"
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <ArrowLeft className="size-5" />
                </button>
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
              <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
                <DialogTitle className="font-bold">My accounts</DialogTitle>
              </DialogHeader>

              <FormProvider {...formMethods}>
                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
                  <div className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl bg-muted p-4">
                    <Info className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">What are my accounts?</p>
                      <p className="text-sm text-muted-foreground">
                        This list protects you from impersonation. Anyone can create a Safe account listing your address
                        as a signer, so only accounts you&apos;ve confirmed appear here.{' '}
                        <ExternalLink href={HELP_CENTER_URL} noIcon sx={{ textDecoration: 'underline' }}>
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
                      <div
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm',
                          isAtLimit ? 'font-semibold text-yellow-700' : 'text-muted-foreground',
                        )}
                      >
                        {selectedKeys.size} of {SAFE_ACCOUNTS_LIMIT} selected
                        <Tooltip>
                          <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
                            <Info className="size-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            You can add up to {SAFE_ACCOUNTS_LIMIT} Safe accounts per workspace
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <InputGroup className="flex-1 rounded-md bg-card">
                        <InputGroupAddon>
                          <Search className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="by name, address or network"
                          aria-label="Search Safe accounts by name, address or network"
                          autoComplete="off"
                          value={rawSearchQuery}
                          onChange={(e) => setRawSearchQuery(e.target.value)}
                          data-testid="add-accounts-search-input"
                        />
                      </InputGroup>
                    </div>
                  )}

                  <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
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
                        flaggedAddresses={similarAddresses}
                        selection={{
                          selectedKeys,
                          onToggle: handleTableToggle,
                          isAtLimit,
                          disabledKeys: spaceSafeKeys,
                          disabledReason: 'This safe is already part of your workspace',
                        }}
                        data-testid="add-accounts-safes-table"
                      />
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mt-4 shrink-0">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-4 flex shrink-0 flex-row items-center gap-3">
                    <div className="flex-1">
                      <Track {...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>
                        <AddManually handleAddSafe={handleAddSafe} disabled={isAtLimit} />
                      </Track>
                    </div>

                    <Button
                      data-testid="add-accounts-button"
                      type="submit"
                      size="lg"
                      disabled={!isFormDirty || isSubmitting}
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
