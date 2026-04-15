import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bookmark, ChevronRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe } from '@/features/spaces'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { Button } from '@/components/ui/button'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature, useSafeSelectionModal } from '@/features/myAccounts'
import { useAppDispatch, useAppSelector } from '@/store'
import { pinSafe, unpinSafe, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'
import AccountsModal from './AccountsModal'

const HIDDEN_ROUTES = [AppRoutes.welcome.accounts, AppRoutes.welcome.spaces]

function DropdownHeader({ onOpen, isPinned, onPin }: { onOpen: () => void; isPinned: boolean; onPin: () => void }) {
  return (
    <div className="flex items-center gap-1 px-4 pt-3 pb-2">
      <button
        onClick={onOpen}
        className="flex items-center gap-1 text-sm font-semibold text-secondary-foreground cursor-pointer bg-transparent border-0"
      >
        Trusted Safes
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPin()
        }}
        className="ml-auto shrink-0 rounded p-1 hover:bg-muted transition-colors cursor-pointer"
        aria-label={isPinned ? 'Trusted' : 'Trust this safe'}
      >
        <Bookmark className={`size-4 ${isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />
      </button>
    </div>
  )
}

function DropdownFooter({ onManage, onClose }: { onManage: () => void; onClose: () => void }) {
  return (
    <div className="px-4 py-3">
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => {
          // Explicitly close the dropdown before opening SafeSelectionModal.
          // SafeSelectionModal is a MUI Dialog and lives outside Radix UI's
          // DismissableLayer chain, so the Select won't auto-close when it opens.
          // TODO: Remove onClose() once SafeSelectionModal is migrated to shadcn —
          // a Radix Dialog will automatically dismiss this Select via DismissableLayer.
          onClose()
          onManage()
        }}
      >
        All accounts
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

function SpaceSafeBar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isLoading, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()
  const [accountsModalOpen, setAccountsModalOpen] = useState(false)
  const selectionModal = useSafeSelectionModal()
  const { SafeSelectionModal } = useLoadFeature(MyAccountsFeature)
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const addedSafes = useAppSelector(selectAllAddedSafes)

  if (HIDDEN_ROUTES.includes(pathname ?? '')) return null

  const isPinned = Boolean(addedSafes[chainId]?.[safeAddress])

  const handleTogglePin = () => {
    if (isPinned) {
      dispatch(unpinSafe({ chainId, address: safeAddress }))
      dispatch(
        showNotification({
          title: 'Safe removed',
          message: safeAddress,
          groupKey: `unpin-safe-${safeAddress}`,
          variant: 'success',
        }),
      )
    } else {
      dispatch(pinSafe({ chainId, address: safeAddress }))
      dispatch(
        showNotification({
          title: 'Safe trusted',
          message: safeAddress,
          groupKey: `pin-safe-${safeAddress}`,
          variant: 'success',
        }),
      )
    }
  }

  const dropdownHeader = !isQualifiedSafe ? (
    <DropdownHeader onOpen={() => setAccountsModalOpen(true)} isPinned={isPinned} onPin={handleTogglePin} />
  ) : undefined
  // footer is a render prop so DropdownFooter can close the Select before opening
  // SafeSelectionModal (MUI). TODO: revert to ReactNode once SafeSelectionModal
  // is migrated to shadcn — see SafeSelectorDropdownProps.footer for details.
  const dropdownFooter = !isQualifiedSafe
    ? (close: () => void) => <DropdownFooter onManage={selectionModal.open} onClose={close} />
    : undefined

  return (
    <div data-testid="safe-level-navigation" className="flex flex-wrap items-center gap-2">
      {isQualifiedSafe && space && <SpaceBackLink space={space} onClick={handleBackToSpace} />}
      <SpaceChainSelector />
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
      <AccountsModal
        open={accountsModalOpen}
        onClose={() => setAccountsModalOpen(false)}
        onManage={selectionModal.open}
      />
      <SafeSelectionModal modal={selectionModal} />
    </div>
  )
}

export default SpaceSafeBar
