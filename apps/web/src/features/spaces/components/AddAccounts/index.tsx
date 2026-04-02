import ModalDialog from '@/components/common/ModalDialog'
import {
  type SafeItem,
  type SafeItems,
  type AllSafeItems,
  flattenSafeItems,
  useSafesSearch,
  getComparator,
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  _buildSafeItem,
  useAllOwnedSafes,
} from '@/hooks/safes'
import AddManually, { type AddManuallyFormValues } from './AddManually'
import { getSafeId } from './SafesList'
import OnboardingSafesList from '../SelectSafesOnboarding/components/OnboardingSafesList'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import { useCurrentSpaceId, useIsAdmin, useSpaceSafes } from '@/features/spaces'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useChains from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'

import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
import { Search, Plus, X, Loader2 } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Track from '@/components/common/Track'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { cn } from '@/utils/cn'

export type AddAccountsFormValues = {
  selectedSafes: Record<string, boolean>
}

function getSelectedSafes(safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return Object.entries(safes).filter(
    ([key, isSelected]) =>
      isSelected &&
      !key.startsWith('multichain_') &&
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

const safeAccountsLimitRaw = Number.parseInt(process.env.NEXT_PUBLIC_SPACES_SAFE_ACCOUNTS_LIMIT ?? '', 10)
const SAFE_ACCOUNTS_LIMIT = !Number.isNaN(safeAccountsLimitRaw) ? safeAccountsLimitRaw : 40

const _groupAndSort = (
  items: SafeItem[],
  sortComparator: (a: AllSafeItems[number], b: AllSafeItems[number]) => number,
): AllSafeItems => {
  const multi = _getMultiChainAccounts(items)
  const single = _getSingleChainAccounts(items, multi)
  return [...multi, ...single].sort(sortComparator)
}

const AddAccounts = () => {
  const isAdmin = useIsAdmin()
  const [open, setOpen] = useState<boolean>(false)
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
  const isDarkMode = useDarkMode()

  // Get wallet and chain info
  const { address: walletAddress = '' } = useWallet() || {}
  const { configs } = useChains()
  const allChainIds = useMemo(() => configs.map((c) => c.chainId), [configs])

  // Get safe data
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  // Build trusted (pinned) and owned safes
  const { trustedSafes, ownedSafes } = useMemo(() => {
    const buildItem = (chainId: string, address: string) =>
      _buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)

    // Get safes already in the space
    const spaceSafeIds = new Set(flattenSafeItems(spaceSafes || []).map((safe) => `${safe.chainId}:${safe.address}`))

    // Trusted safes: from addedSafes (user-pinned), excluding space safes
    const trusted = allChainIds
      .flatMap((chainId) => Object.keys(allAdded[chainId] || {}).map((address) => buildItem(chainId, address)))
      .filter((safe) => !spaceSafeIds.has(`${safe.chainId}:${safe.address}`))

    // Owned safes: from CGW API + undeployed, excluding space safes
    const owned = allChainIds.flatMap((chainId) => {
      const combined = [...new Set([...(allOwned[chainId] || []), ...Object.keys(allUndeployed[chainId] || {})])]
      return combined
        .filter(
          (address) =>
            !trusted.some((t) => t.chainId === chainId && sameAddress(t.address, address)) &&
            !spaceSafeIds.has(`${chainId}:${address}`),
        )
        .map((address) => buildItem(chainId, address))
    })

    // Add manually added safes to owned
    const allOwned_ = [...owned, ...manualSafes]

    return {
      trustedSafes: _groupAndSort(trusted, sortComparator),
      ownedSafes: _groupAndSort(allOwned_, sortComparator),
    }
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
    spaceSafes,
  ])

  // Detect similar addresses
  const similarAddresses = useMemo<Set<string>>(() => {
    const allItems = [...trustedSafes, ...ownedSafes]
    const uniqueAddresses = [...new Set(allItems.map((s) => s.address))]
    if (uniqueAddresses.length < 2) return new Set()
    const result = detectSimilarAddresses(uniqueAddresses)
    return new Set(uniqueAddresses.filter((addr) => result.isFlagged(addr)).map((a) => a.toLowerCase()))
  }, [trustedSafes, ownedSafes])

  const [rawSearchQuery, setRawSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(rawSearchQuery, 300)
  const filteredTrusted = useSafesSearch(trustedSafes, debouncedSearchQuery)
  const filteredOwned = useSafesSearch(ownedSafes, debouncedSearchQuery)

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

  // Reset form when modal opens
  useEffect(() => {
    if (open && !hasResetForOpen.current) {
      reset({ selectedSafes: defaultSelectedSafes })
      hasResetForOpen.current = true
    } else if (!open) {
      hasResetForOpen.current = false
    }
  }, [open, defaultSelectedSafes, reset])

  const onSubmit = handleSubmit(async (data) => {
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
          spaceId: Number(spaceId),
          createSpaceSafesDto: { safes: safesToAdd },
        })

        if (result.error) {
          setError(getRtkQueryErrorMessage(result.error) || 'Something went wrong adding one or more Safe Accounts.')
          return
        }
      }

      // Remove unchecked safes
      if (safesToRemove.length > 0) {
        const result = await removeSafesFromSpace({
          spaceId: Number(spaceId),
          deleteSpaceSafesDto: { safes: safesToRemove },
        })

        if (result.error) {
          setError(getRtkQueryErrorMessage(result.error) || 'Something went wrong removing one or more Safe Accounts.')
          return
        }
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
    } catch (e) {
      console.log(e)
    }
  })

  const handleAddSafe = (data: AddManuallyFormValues) => {
    const allSafes = [...trustedSafes, ...ownedSafes]
    const alreadyExists = allSafes.some((safe) => safe.address === data.address)

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

  const handleClose = () => {
    setError(undefined)
    setRawSearchQuery('')
    setManualSafes([])
    setValue('selectedSafes', {}) // Reset doesn't seem to work consistently with an object
    setOpen(false)
  }

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.add_accounts_modal })
    }
  }, [debouncedSearchQuery])

  const hasAvailableSafes = trustedSafes.length > 0 || ownedSafes.length > 0

  return (
    <>
      <Button
        size="sm"
        className="font-bold"
        variant="outline"
        disabled={!isAdmin}
        onClick={() => setOpen(true)}
        title={!isAdmin ? 'You need to be an Admin to add accounts' : ''}
      >
        <Plus className="size-4" />
        Add Accounts
      </Button>

      <ModalDialog open={open} fullScreen hideChainIndicator>
        <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
          <div className="flex h-dvh max-h-dvh w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden bg-secondary p-4">
            <div className="mx-auto flex justify-center min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-6 sm:max-w-[520px]">
              <FormProvider {...formMethods}>
                <form onSubmit={onSubmit} className="flex flex-col min-h-0 w-full gap-6">
                  <div className="flex shrink-0 flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Button type="button" variant="ghost" size="icon" onClick={handleClose} className="rounded-md">
                        <X className="size-5" />
                      </Button>
                      <Typography variant="h2" align="center" className="flex-1">
                        Add Safe Accounts
                      </Typography>
                      <div className="size-10" />
                    </div>

                    <Typography variant="paragraph" align="center" color="muted">
                      You can add up to {SAFE_ACCOUNTS_LIMIT} Safe accounts
                    </Typography>

                    <InputGroup className="bg-card px-2">
                      <InputGroupAddon>
                        <Search className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder="Search for safes"
                        aria-label="Search Safe list"
                        autoComplete="off"
                        onChange={(e) => setRawSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </div>

                  <div
                    className="relative min-h-[30dvh] min-w-0 w-full max-h-[25rem] overflow-y-auto overflow-x-hidden after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:z-10 after:h-16 after:bg-gradient-to-t after:from-secondary after:to-transparent [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]"
                    data-testid="add-accounts-safes-list-scroll-region"
                  >
                    {!hasAvailableSafes && !debouncedSearchQuery ? (
                      <Typography variant="paragraph" align="center" color="muted" className="py-8">
                        No safes on your list
                      </Typography>
                    ) : (
                      <OnboardingSafesList
                        trustedSafes={debouncedSearchQuery ? filteredTrusted : trustedSafes}
                        ownedSafes={debouncedSearchQuery ? filteredOwned : ownedSafes}
                        similarAddresses={similarAddresses}
                      />
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive" className="shrink-0">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex shrink-0 flex-col gap-2">
                    <Track {...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>
                      <AddManually handleAddSafe={handleAddSafe} />
                    </Track>

                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        data-testid="save-accounts-button"
                        type="submit"
                        size="lg"
                        disabled={!isFormDirty || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          `Add Accounts (${selectedSafesLength})`
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full hover:bg-card"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </FormProvider>
            </div>
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

export default AddAccounts
