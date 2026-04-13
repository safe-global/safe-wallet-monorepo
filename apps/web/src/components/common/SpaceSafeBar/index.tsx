import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe } from '@/features/spaces'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { Button } from '@/components/ui/button'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'

const HIDDEN_ROUTES = [AppRoutes.welcome.accounts, AppRoutes.welcome.spaces]

function DropdownHeader() {
  return (
    <button className="flex items-center gap-1 px-4 pt-3 pb-2 text-sm font-semibold text-secondary-foreground cursor-pointer bg-transparent border-0">
      Trusted Safes
      <ChevronRight className="size-4" />
    </button>
  )
}

function DropdownFooter() {
  return (
    <div className="px-4 py-3">
      <Button variant="secondary" size="sm" className="w-full">
        All accounts
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

function SpaceSafeBar() {
  const pathname = usePathname()
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()

  if (HIDDEN_ROUTES.includes(pathname ?? '')) return null

  const dropdownHeader = !isQualifiedSafe ? <DropdownHeader /> : undefined
  const dropdownFooter = !isQualifiedSafe ? <DropdownFooter /> : undefined

  return (
    <div data-testid="safe-level-navigation" className="flex flex-wrap items-center gap-2">
      {isQualifiedSafe && space && <SpaceBackLink space={space} onClick={handleBackToSpace} />}
      <SpaceChainSelector />
      <SpaceNestedSafesButton />
      <SafeSelectorDropdown
        items={items}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        isError={isError}
        onRetry={refetch}
        header={dropdownHeader}
        footer={dropdownFooter}
      />
    </div>
  )
}

export default SpaceSafeBar
