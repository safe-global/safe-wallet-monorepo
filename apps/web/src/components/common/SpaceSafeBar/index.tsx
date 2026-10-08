import { useCallback, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { SafeSelectorDropdown, useCurrentSpaceId } from '@/features/spaces'
import type { SafeItemData, SafeRenameTarget } from '@/features/spaces'
import { matchesSafeSearch } from '@/features/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  getSpaceOrderScope,
  OrderByOption,
  selectOrderByPreference,
  setManualOrder,
  TRUSTED_ORDER_SCOPE,
} from '@/store/orderByPreferenceSlice'
import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookWriteScope } from '@/features/spaces'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { useIsTopbarAboveOverlay } from '@/hooks/useTopbarElevation'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useSpaceSafeSelectorItems, type DropdownTab } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'
import {
  ConnectWalletBody,
  DropdownTabs,
  ManageTrustedFooter,
  NoTrustedAccountsBody,
  SignInWorkspaceCta,
  SpaceSafeBarView,
} from '@views/components/common/SpaceSafeBar/SpaceSafeBarView'

const HIDDEN_ROUTES = [
  AppRoutes.welcome.accounts,
  AppRoutes.welcome.spaces,
  AppRoutes.newSafe.create,
  AppRoutes.newSafe.advancedCreate,
  AppRoutes.newSafe.load,
  AppRoutes.licenses,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes['403'],
  AppRoutes['404'],
  AppRoutes['_offline'],
]

function SpaceSafeBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const urlSafeAddress = useSafeAddressFromUrl()
  const isSignedIn = useIsSignedIn()
  const {
    workspaceItems,
    localItems,
    selectedItemId,
    handleItemSelect,
    isLoading,
    isError,
    refetch,
    isInSpaceContext,
    hasWallet,
  } = useSpaceSafeSelectorItems()
  // Skeleton on the first render: the contents derive from the URL address, which is empty until mounted.
  const showSelectorSkeleton = isLoading || !isHydrated
  const { space } = useSpaceBackLink()
  const [selectedTab, setSelectedTab] = useState<DropdownTab | null>(null)
  const [search, setSearch] = useState('')
  const [renameTarget, setRenameTarget] = useState<SafeRenameTarget | null>(null)
  const { scope: renameScope } = useAddressBookWriteScope(renameTarget?.address, renameTarget?.chainIds ?? [])
  const connectWallet = useConnectWallet()
  const trustedSafesModal = useTrustedSafesModal()
  const isAboveOverlay = useIsTopbarAboveOverlay()
  const resolveName = useSafeNameResolver()
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const spaceId = useCurrentSpaceId()

  // Union feeds the trigger (which always shows the current safe, present in both lists).
  // The same safe can appear in both lists under one id at different depth — e.g. a chain-scoped
  // fallback in the workspace list vs the multi-chain group in the trusted list — so on duplicate
  // ids keep the entry that knows more chains.
  const unionItems = useMemo<SafeItemData[]>(() => {
    const byId = new Map<string, SafeItemData>()
    for (const item of [...workspaceItems, ...localItems]) {
      const existing = byId.get(item.id)
      if (!existing || item.chains.length > existing.chains.length) byId.set(item.id, item)
    }
    return [...byId.values()]
  }, [workspaceItems, localItems])

  // The tab labels count the search matches of each tab, so the counts stay in sync with the
  // filtering the dropdown list applies (same query, same predicate).
  const query = search.trim().toLowerCase()
  const countMatches = useCallback(
    (list: SafeItemData[]) =>
      query
        ? list.filter((item) =>
            matchesSafeSearch(item, resolveName(item.address, item.chains[0]?.chainId, item.name), query),
          ).length
        : list.length,
    [query, resolveName],
  )

  // Use the matched Next.js route, not `usePathname`: error pages (404/403) render
  // under the original unmatched URL (e.g. `/hom`), where `usePathname` wouldn't match.
  if (HIDDEN_ROUTES.includes(router.pathname)) return null
  // /settings/* serves both per-safe (URL has ?safe=) and global pages — hide when no safe context.
  if (pathname?.startsWith(AppRoutes.settings.index) && !urlSafeAddress) return null

  const activeTab: DropdownTab = selectedTab ?? (isInSpaceContext ? 'workspace' : 'local')

  // The Workspace tab lists the space's safes only when the current safe is part of a space;
  // otherwise it shows the sign-in CTA. The Local tab always lists the trusted safes.
  const listItems = activeTab === 'workspace' ? (isInSpaceContext ? workspaceItems : []) : localItems

  // Manual sort turns the active tab's list into a drag-to-reorder list. The order persists to the
  // same scope the welcome/workspace tables use — trusted for My accounts, this space for the
  // workspace tab — so every surface stays in sync. The Workspace tab has no scope outside a space,
  // so it isn't reorderable there. Kept defined while searching so the dropdown doesn't swap the list
  // component (which steals focus from the search input); dragging is disabled there instead.
  const reorderScope = activeTab === 'local' ? TRUSTED_ORDER_SCOPE : spaceId ? getSpaceOrderScope(spaceId) : undefined
  const handleReorder =
    orderBy === OrderByOption.MANUAL && reorderScope
      ? (order: string[]) => dispatch(setManualOrder({ scope: reorderScope, order }))
      : undefined

  const dropdownHeader = (
    <DropdownTabs
      activeTab={activeTab}
      onSelect={setSelectedTab}
      isInSpaceContext={isInSpaceContext}
      spaceName={space?.name}
      workspaceCount={countMatches(workspaceItems)}
      localCount={countMatches(localItems)}
    />
  )

  // The empty Local tab surfaces the manage-trusted CTA inside its empty state, so the footer row is
  // dropped there to avoid a redundant second entry point.
  const dropdownFooter =
    activeTab === 'local' && localItems.length > 0
      ? (close: () => void) => (
          <ManageTrustedFooter
            onManage={() => {
              close()
              trustedSafesModal.open()
            }}
          />
        )
      : undefined

  const emptyStateOverride =
    activeTab === 'workspace' && !isInSpaceContext ? (
      <SignInWorkspaceCta
        isSignedIn={isSignedIn}
        onSignIn={() => router.push({ pathname: AppRoutes.welcome.spaces })}
      />
    ) : activeTab === 'local' && !hasWallet ? (
      // Close the dropdown before opening onboarding — the popup renders above the wallet modal,
      // so leaving it open hides the modal behind it.
      (close: () => void) => (
        <ConnectWalletBody
          onConnect={() => {
            close()
            connectWallet()
          }}
        />
      )
    ) : activeTab === 'local' ? (
      (close: () => void) => (
        <NoTrustedAccountsBody
          onManage={() => {
            close()
            trustedSafesModal.open()
          }}
        />
      )
    ) : undefined

  return (
    <SpaceSafeBarView
      isAboveOverlay={isAboveOverlay}
      selector={
        <SafeSelectorDropdown
          items={unionItems}
          listItems={listItems}
          selectedItemId={selectedItemId}
          onItemSelect={(itemId) => handleItemSelect(itemId, activeTab)}
          isLoading={showSelectorSkeleton}
          isError={isError}
          onRetry={refetch}
          header={dropdownHeader}
          footer={dropdownFooter}
          emptyStateOverride={emptyStateOverride}
          searchValue={search}
          onSearchValueChange={setSearch}
          onItemRename={setRenameTarget}
          onReorder={handleReorder}
          keepOpen={renameTarget !== null}
        />
      }
      nestedSafesButton={<SpaceNestedSafesButton />}
      chainSelector={<SpaceChainSelector isLoading={showSelectorSkeleton} />}
      trustedSafesModal={<TrustedSafesModal modal={trustedSafesModal} />}
      renameDialogOpen={renameTarget !== null}
      renderRenameDialog={(layer) =>
        renameTarget && (
          <EntryDialog
            handleClose={() => setRenameTarget(null)}
            defaultValues={{ name: renameTarget.name, address: renameTarget.address }}
            chainIds={renameTarget.chainIds}
            scope={renameScope}
            disableAddressInput
            {...layer}
          />
        )
      }
    />
  )
}

export default SpaceSafeBar
