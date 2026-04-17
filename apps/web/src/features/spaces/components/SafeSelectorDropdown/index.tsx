import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import SafeSelectorError from './components/SafeSelectorError'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { getSafeSelectorClassVariants } from './utils/classVariants'
import type { SafeSelectorDropdownProps } from './types'

function SafeSelectorDropdownSkeleton() {
  return (
    <div className="w-full sm:w-[430px] min-h-[calc(68px)] flex items-center gap-4 rounded-lg p-2 pl-6 bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-14 rounded" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

function SafeSelectorDropdown({
  items,
  selectedItemId,
  onItemSelect,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
}: SafeSelectorDropdownProps) {
  const hasDropdownContent = Boolean(header) || Boolean(footer) || isLoading || isError
  const {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    handleOpenChange,
    handleSafeChange,
    closeDropdown,
  } = useSafeSelectorState({ items, selectedItemId, onItemSelect, forceOpenable: hasDropdownContent })

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  if (!selectedItem) {
    if (isError) return <SafeSelectorError onRetry={onRetry} />
    if (isLoading) return <SafeSelectorDropdownSkeleton />
    return null
  }

  return (
    <div
      data-testid="space-safes-navigation-block"
      className={cn(
        // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
        'group relative w-full sm:w-[430px] min-h-[calc(68px)] flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg p-2 overflow-hidden bg-card focus:ring-0',
        variants.wrapperClass,
      )}
    >
      <div className="pointer-events-none absolute inset-1 rounded-md bg-muted/30 opacity-0 group-hover:opacity-100" />
      <Select
        value={safeSelectValue}
        onValueChange={handleSafeChange}
        open={variants.canOpen ? dropdownOpen : false}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 border-0 shadow-none bg-transparent dark:bg-transparent py-0 pl-6 hover:bg-transparent dark:hover:bg-transparent data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0 relative',
            variants.triggerClass,
          )}
          size="default"
          iconWrapperClassName={variants.iconWrapperClass}
        >
          <SelectValue>
            <SafeSelectorTriggerContent selectedItem={selectedItem} selectedChainId={selectedChainId} />
          </SelectValue>
        </SelectTrigger>
        <SafeDropdownContainer
          items={items}
          selectedItemId={safeSelectValue}
          onItemSelect={safeItemSelect}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          header={header}
          footer={footer}
          closeDropdown={closeDropdown}
        />
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
