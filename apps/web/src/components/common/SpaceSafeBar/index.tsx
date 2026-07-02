import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { Wallet } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { SafeSelectorDropdown } from '@/features/spaces'
import type { SafeItemData } from '@/features/spaces'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'
import AccountsModal from './AccountsModal'

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
}: {
  activeTab: DropdownTab
  onSelect: (tab: DropdownTab) => void
  workspaceLabel: string
}) {
  const tabClass = (tab: DropdownTab) =>
    cn(
      'min-w-0 flex-1 truncate rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    )
  return (
    <div className="mx-3 mb-1 mt-3 flex gap-1 rounded-lg bg-muted p-1">
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
        Trusted
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

function LocalDropdownFooter({ onManage, onAdd }: { onManage: () => void; onAdd: () => void }) {
  return (
    <div className="flex gap-2 px-4 py-3">
      <Button
        variant="secondary"
        size="sm"
        className="flex-1"
        onClick={onManage}
        data-testid="dropdown-manage-trusted-btn"
      >
        Manage trusted Safes
      </Button>
      <Button variant="secondary" size="sm" className="flex-1" onClick={onAdd} data-testid="dropdown-add-account-btn">
        Add Safe Account
      </Button>
    </div>
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
  const [accountsModalOpen, setAccountsModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<DropdownTab | null>(null)
  const connectWallet = useConnectWallet()
  const trustedSafesModal = useTrustedSafesModal()

  // Union feeds the trigger (which always shows the current safe, present in both lists).
  const unionItems = useMemo<SafeItemData[]>(() => {
    const seen = new Set<string>()
    return [...workspaceItems, ...localItems].filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [workspaceItems, localItems])

  // Use the matched Next.js route, not `usePathname`: error pages (404/403) render
  // under the original unmatched URL (e.g. `/hom`), where `usePathname` wouldn't match.
  if (HIDDEN_ROUTES.includes(router.pathname)) return null
  // /settings/* serves both per-safe (URL has ?safe=) and global pages — hide when no safe context.
  if (pathname?.startsWith(AppRoutes.settings.index) && !urlSafeAddress) return null

  const activeTab: DropdownTab = selectedTab ?? (isInSpaceContext ? 'workspace' : 'local')

  // The Workspace tab lists the space's safes only when the current safe is part of a space;
  // otherwise it shows the sign-in CTA. The Local tab always lists the trusted safes.
  const listItems = activeTab === 'workspace' ? (isInSpaceContext ? workspaceItems : []) : localItems

  const dropdownHeader = (
    <DropdownTabs activeTab={activeTab} onSelect={setSelectedTab} workspaceLabel={space?.name ?? 'Workspace'} />
  )

  const dropdownFooter =
    activeTab === 'local'
      ? () => <LocalDropdownFooter onManage={trustedSafesModal.open} onAdd={() => setAccountsModalOpen(true)} />
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
    <div data-testid="safe-level-navigation" className="flex flex-wrap items-center gap-2 max-[899px]:justify-end">
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
        />
      </div>
      <SpaceNestedSafesButton />
      <SpaceChainSelector isLoading={isLoading} />
      <AccountsModal
        open={accountsModalOpen}
        onClose={() => setAccountsModalOpen(false)}
        onManageTrustedSafes={trustedSafesModal.open}
      />
      <TrustedSafesModal modal={trustedSafesModal} />
    </div>
  )
}

export default SpaceSafeBar
