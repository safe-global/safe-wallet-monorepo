import { useCallback, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { ChevronRight, UserRoundPlus, Wallet } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { SafeSelectorDropdown } from '@/features/spaces'
import type { SafeItemData, SafeRenameTarget } from '@/features/spaces'
import { matchesSafeSearch } from '@/features/spaces'
import EntryDialog from '@/components/address-book/EntryDialog'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'

type DropdownTab = 'workspace' | 'local'

const HIDDEN_ROUTES = [
  AppRoutes.welcome.accounts,
  AppRoutes.welcome.spaces,
  AppRoutes.newSafe.create,
  AppRoutes.newSafe.advancedCreate,
  AppRoutes.newSafe.load,
  AppRoutes.terms,
  AppRoutes.privacy,
  AppRoutes.licenses,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes['403'],
  AppRoutes['404'],
  AppRoutes['_offline'],
]

function DropdownTabs({
  activeTab,
  onSelect,
  workspaceLabel,
  localLabel,
}: {
  activeTab: DropdownTab
  onSelect: (tab: DropdownTab) => void
  workspaceLabel: string
  localLabel: string
}) {
  const tabClass = (tab: DropdownTab) =>
    cn(
      'min-w-0 flex-1 truncate rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    )
  return (
    <div className="mx-3 mb-1 mt-2 flex gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        className={tabClass('workspace')}
        onClick={() => onSelect('workspace')}
        data-testid="dropdown-tab-workspace"
      >
        {workspaceLabel}
      </button>
      <button
        type="button"
        className={tabClass('local')}
        onClick={() => onSelect('local')}
        data-testid="dropdown-tab-local"
      >
        {localLabel}
      </button>
    </div>
  )
}

function SignInWorkspaceCta({ label, onSignIn }: { label: string; onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" data-testid="dropdown-signin-cta">
      <p className="text-sm text-muted-foreground">
        Sign in to a workspace to collaborate on Safe accounts with your team.
      </p>
      <Button variant="secondary" size="sm" onClick={onSignIn} data-testid="dropdown-signin-btn">
        {label}
      </Button>
    </div>
  )
}

function ConnectWalletBody({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" data-testid="dropdown-connect-cta">
      <p className="text-sm text-muted-foreground">Connect your wallet to find your Safe accounts.</p>
      <Button variant="secondary" size="sm" onClick={onConnect} data-testid="dropdown-connect-wallet-body-btn">
        <Wallet className="size-4" /> Connect wallet
      </Button>
    </div>
  )
}

function ManageTrustedFooter({ onManage }: { onManage: () => void }) {
  return (
    <button
      type="button"
      onClick={onManage}
      data-testid="dropdown-manage-trusted-btn"
      className="flex w-full cursor-pointer items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-muted/30"
    >
      <UserRoundPlus className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small-medium">Manage trusted accounts</Typography>
        <Typography variant="paragraph-mini" color="muted">
          Add or remove accounts from this list
        </Typography>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

function SpaceSafeBar() {
  const pathname = usePathname()
  const router = useRouter()
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
  const { space } = useSpaceBackLink()
  const [selectedTab, setSelectedTab] = useState<DropdownTab | null>(null)
  const [search, setSearch] = useState('')
  const [renameTarget, setRenameTarget] = useState<SafeRenameTarget | null>(null)
  const connectWallet = useConnectWallet()
  const trustedSafesModal = useTrustedSafesModal()
  const resolveName = useSafeNameResolver()

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

  const workspaceName = space?.name ?? 'Workspace'
  const workspaceLabel = isInSpaceContext ? `${workspaceName} (${countMatches(workspaceItems)})` : workspaceName
  const localLabel = `Trusted accounts (${countMatches(localItems)})`

  const dropdownHeader = (
    <DropdownTabs
      activeTab={activeTab}
      onSelect={setSelectedTab}
      workspaceLabel={workspaceLabel}
      localLabel={localLabel}
    />
  )

  const dropdownFooter =
    activeTab === 'local'
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
        label={isSignedIn ? 'View workspaces' : 'Sign in'}
        onSignIn={() => router.push({ pathname: AppRoutes.welcome.spaces })}
      />
    ) : activeTab === 'local' && !hasWallet ? (
      <ConnectWalletBody onConnect={connectWallet} />
    ) : undefined

  return (
    <div data-testid="safe-level-navigation" className="flex max-[899px]:justify-end">
      {/* One pill: safe selector + nested safes + network selector render as muted chips
          sharing a single white card (see Figma topbar). */}
      <div className="flex flex-wrap items-stretch gap-2 rounded-lg bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        {/* Under 430px the safe selector drops to its own full-width row below the nested/network controls. */}
        <div className="contents max-[429px]:block max-[429px]:order-[10000] max-[429px]:min-w-0 max-[429px]:basis-full">
          <SafeSelectorDropdown
            items={unionItems}
            listItems={listItems}
            selectedItemId={selectedItemId}
            onItemSelect={handleItemSelect}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            header={dropdownHeader}
            footer={dropdownFooter}
            emptyStateOverride={emptyStateOverride}
            searchValue={search}
            onSearchValueChange={setSearch}
            onItemRename={setRenameTarget}
          />
        </div>
        <SpaceNestedSafesButton />
        <SpaceChainSelector isLoading={isLoading} />
      </div>
      <TrustedSafesModal modal={trustedSafesModal} />
      {renameTarget && (
        <EntryDialog
          handleClose={() => setRenameTarget(null)}
          defaultValues={{ name: renameTarget.name, address: renameTarget.address }}
          chainIds={renameTarget.chainIds}
          disableAddressInput
        />
      )}
    </div>
  )
}

export default SpaceSafeBar
