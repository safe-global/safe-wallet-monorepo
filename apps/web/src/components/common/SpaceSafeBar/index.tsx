import { useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { Bookmark, ChevronRight, Wallet } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe } from '@/features/spaces'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useAppDispatch, useAppSelector } from '@/store'
import { pinSafe, unpinSafe, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS } from '@/services/analytics/events/overview'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useAllSafes } from '@/hooks/safes'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { sameAddress } from '@safe-global/utils/utils/addresses'
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

function DropdownHeader({ isPinned, onPin }: { isPinned: boolean; onPin: () => void }) {
  return (
    <div className="flex items-center gap-1 px-4 pt-3 pb-2">
      <span className="text-sm font-semibold text-secondary-foreground">Trusted Safes</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
              className="ml-auto shrink-0 rounded p-1 hover:bg-muted transition-colors cursor-pointer"
              aria-label={isPinned ? 'Trusted' : 'Trust this safe'}
            />
          }
        >
          <Bookmark className={`size-4 ${isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />
        </TooltipTrigger>
        <TooltipContent>{isPinned ? 'Remove from trusted Safes' : 'Add to trusted Safes'}</TooltipContent>
      </Tooltip>
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
  const router = useRouter()
  const urlSafeAddress = useSafeAddressFromUrl()
  const dispatch = useAppDispatch()
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isLoading, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()
  const [accountsModalOpen, setAccountsModalOpen] = useState(false)
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const allSafeItems = useAllSafes()
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { txFlow } = useContext(TxModalContext)

  // `usePathname` reflects the browser URL, but error pages (404/403) render under
  // the original unmatched URL (e.g. `/hom`), so also check the matched Next.js route.
  if (HIDDEN_ROUTES.includes(pathname ?? '') || HIDDEN_ROUTES.includes(router.pathname)) return null
  // /settings/* serves both per-safe (URL has ?safe=) and global pages — hide when no safe context.
  if (pathname?.startsWith(AppRoutes.settings.index) && !urlSafeAddress) return null

  // Check if current safe is pinned on any chain
  const isPinned = Boolean(addedSafes[chainId]?.[safeAddress])

  const handleTogglePin = () => {
    // Find all chains where this safe address exists
    const safesOnAllChains = allSafeItems?.filter((s) => sameAddress(s.address, safeAddress)) ?? []

    if (isPinned) {
      safesOnAllChains.forEach((s) => dispatch(unpinSafe({ chainId: s.chainId, address: s.address })))
      dispatch(
        showNotification({
          title: 'Safe removed',
          message: safeAddress,
          groupKey: `unpin-safe-${safeAddress}`,
          variant: 'success',
        }),
      )
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
    } else {
      // If safe is only known on current chain (e.g. navigated via URL), pin just that
      const toPinList = safesOnAllChains.length > 0 ? safesOnAllChains : [{ chainId, address: safeAddress }]
      toPinList.forEach((s) => dispatch(pinSafe({ chainId: s.chainId, address: s.address })))
      dispatch(
        showNotification({
          title: 'Safe trusted',
          message: safeAddress,
          groupKey: `pin-safe-${safeAddress}`,
          variant: 'success',
        }),
      )
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
    }
  }

  const handleOpenAccountsModal = () => {
    setAccountsModalOpen(true)
  }

  const dropdownHeader = isQualifiedSafe ? (
    <DropdownWorkspaceHeader />
  ) : (
    <DropdownHeader isPinned={isPinned} onPin={handleTogglePin} />
  )

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
