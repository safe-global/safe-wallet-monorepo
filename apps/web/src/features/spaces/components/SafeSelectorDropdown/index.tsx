import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import SafeSelectorError from './components/SafeSelectorError'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { getSafeSelectorClassVariants } from './utils/classVariants'
import type { SafeSelectorDropdownProps } from './types'

function SafeSelectorDropdown({ items, selectedItemId, onItemSelect, isError, onRetry }: SafeSelectorDropdownProps) {
  const { dropdownOpen, selectedChainId, selectedItem, isSingleSafe, handleOpenChange, handleSafeChange } =
    useSafeSelectorState({ items, selectedItemId, onItemSelect })

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  if (!selectedItem) {
    return null
  }

  if (isError) {
    return <SafeSelectorError onRetry={onRetry} />
  }

  return (
    <div
      className={cn(
        // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
        'group relative w-full sm:w-[430px] min-h-[calc(68px)] flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-lg p-2 overflow-hidden bg-card focus:ring-0',
        variants.wrapperClass,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-muted/30 opacity-0 group-hover:opacity-100" />
      <Select
        value={safeSelectValue}
        onValueChange={handleSafeChange}
        open={variants.canOpen ? dropdownOpen : false}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 border-0 shadow-none bg-transparent dark:bg-transparent py-0 pl-6 hover:bg-transparent dark:hover:bg-transparent data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0 relative z-10',
            variants.triggerClass,
          )}
          size="default"
          iconWrapperClassName={variants.iconWrapperClass}
        >
          <SelectValue>
            <SafeSelectorTriggerContent selectedItem={selectedItem} selectedChainId={selectedChainId} />
          </SelectValue>
        </SelectTrigger>
        <SafeDropdownContainer items={items} selectedItemId={safeSelectValue} onItemSelect={safeItemSelect} />
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
