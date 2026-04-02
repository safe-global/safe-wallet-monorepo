import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { useIsQualifiedSafe } from '@/features/spaces'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'

function SpaceSafeBar() {
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, isError, refetch } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()

  if (!isQualifiedSafe) return null

  return (
    <div
      data-testid="safe-level-navigation"
      className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pt-4 pb-0"
      style={{ backgroundColor: 'var(--color-background-main)' }}
    >
      {space && <SpaceBackLink space={space} onClick={handleBackToSpace} />}
      <SpaceChainSelector />
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
