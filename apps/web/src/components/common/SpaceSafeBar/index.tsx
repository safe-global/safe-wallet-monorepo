import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { useIsQualifiedSafe } from '@/features/spaces'
import { useSpaceSafeSelectorItems } from './useSpaceSafeSelectorItems'

function SpaceSafeBar() {
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, handleChainChange, isError, refetch } = useSpaceSafeSelectorItems()

  if (!isQualifiedSafe) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background">
      {/* TODO: backlink to space (left side) */}
      <SafeSelectorDropdown
        items={items}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        onChainChange={handleChainChange}
        isError={isError}
        onRetry={refetch}
      />
    </div>
  )
}

export default SpaceSafeBar
