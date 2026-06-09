import { useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TxModalContext } from '@/components/tx-flow'
import { ChevronRight, Wallet } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe } from '@/features/spaces'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'
import AccountsModal from './AccountsModal'

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

function DropdownHeader() {
  return (
    <div className="flex items-center gap-1 px-4 pt-3 pb-2">
      <span className="text-sm font-semibold text-secondary-foreground">Trusted Safes</span>
    </div>
  )
}

function DropdownWorkspaceHeader() {
  return (
    <div className="flex items-center gap-1 px-4 pt-3 pb-2">
      <span className="text-sm font-semibold text-secondary-foreground" data-testid="workspace-header">
        Safes in this workspace
      </span>
    </div>
  )
}

function DropdownFooter({ onOpen, label }: { onOpen: () => void; label: string }) {
  return (
    <div className="px-4 py-3">
      <Button variant="secondary" size="sm" className="w-full" onClick={onOpen} data-testid="all-accounts-btn">
        {label}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

function ConnectWalletFooter({ onConnect, onClose }: { onConnect: () => void; onClose: () => void }) {
  return (
    <div className="px-4 py-3">
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        data-testid="safe-selector-connect-wallet-btn"
        onClick={() => {
          onClose()
          onConnect()
        }}
      >
        <Wallet className="size-4" />
        Connect wallet
      </Button>
    </div>
  )
}

function SpaceSafeBar() {
  const pathname = usePathname()
  const urlSafeAddress = useSafeAddressFromUrl()
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isLoading, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()
  const [accountsModalOpen, setAccountsModalOpen] = useState(false)
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { txFlow } = useContext(TxModalContext)

  if (HIDDEN_ROUTES.includes(pathname ?? '')) return null
  // /settings/* serves both per-safe (URL has ?safe=) and global pages — hide when no safe context.
  if (pathname?.startsWith(AppRoutes.settings.index) && !urlSafeAddress) return null

  const handleOpenAccountsModal = () => {
    setAccountsModalOpen(true)
  }

  const dropdownHeader = isQualifiedSafe ? <DropdownWorkspaceHeader /> : <DropdownHeader />

  const hasPinnedSafes = Object.values(addedSafes).some((chain) => Object.keys(chain).length > 0)
  const showConnectWallet = !wallet && !hasPinnedSafes

  const dropdownFooter =
    showConnectWallet && !isQualifiedSafe
      ? (close: () => void) => <ConnectWalletFooter onConnect={connectWallet} onClose={close} />
      : (close: () => void) => (
          <DropdownFooter
            label={isQualifiedSafe ? 'Explore other Safes' : 'All Accounts'}
            onOpen={() => {
              close()
              handleOpenAccountsModal()
            }}
          />
        )

  return (
    <div data-testid="safe-level-navigation" className="flex flex-wrap items-center gap-2">
      {isQualifiedSafe && space && !txFlow && <SpaceBackLink space={space} onClick={handleBackToSpace} />}
      <SpaceChainSelector isLoading={isLoading} />
      <SpaceNestedSafesButton />
      <SafeSelectorDropdown
        items={items}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        header={dropdownHeader}
        footer={dropdownFooter}
      />
      <AccountsModal open={accountsModalOpen} onClose={() => setAccountsModalOpen(false)} />
    </div>
  )
}

export default SpaceSafeBar
