import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe } from '@/features/spaces'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'

const HIDDEN_ROUTES = [AppRoutes.welcome.accounts, AppRoutes.welcome.spaces]

function SpaceSafeBar() {
  const pathname = usePathname()
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()

  if (HIDDEN_ROUTES.includes(pathname ?? '')) return null

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
      />
    </div>
  )
}

export default SpaceSafeBar
