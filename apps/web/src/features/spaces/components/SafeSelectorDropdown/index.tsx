import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { getSafeSelectorClassVariants } from './utils/classVariants'
import type { SafeSelectorDropdownProps } from './types'

function SafeSelectorDropdown({
  items,
  selectedItemId,
  onItemSelect,
  onChainChange,
  isError,
  onRetry,
}: SafeSelectorDropdownProps) {
  const {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    hasMultipleChains,
    handleOpenChange,
    handleChainSelect,
    handleSafeChange,
  } = useSafeSelectorState({ items, selectedItemId, onItemSelect, onChainChange })

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  if (!selectedItem) {
    return null
  }

  if (isError) {
    return (
      <Alert
        variant="destructive"
        className="w-auto rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] *:[svg]:row-span-1 *:[svg]:translate-y-0 *:[svg]:self-center"
      >
        <AlertCircle />
        <AlertTitle className="flex items-center justify-between gap-4">
          Failed to load Safe data
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onRetry}
            >
              <RotateCw className="size-3.5" />
              Retry
            </Button>
          )}
        </AlertTitle>
      </Alert>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        variants.wrapperClass,
      )}
    >
      <Select
        value={safeSelectValue}
        onValueChange={handleSafeChange}
        open={variants.canOpen ? dropdownOpen : false}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent py-0 pl-6 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0',
            variants.triggerClass,
          )}
          size="default"
          iconWrapperClassName={variants.iconWrapperClass}
        >
          <SelectValue>
            <SafeSelectorTriggerContent
              selectedItem={selectedItem}
              selectedChainId={selectedChainId}
              hasMultipleChains={hasMultipleChains}
              onChainSelect={handleChainSelect}
            />
          </SelectValue>
        </SelectTrigger>
        <SafeDropdownContainer items={items} selectedItemId={safeSelectValue} onItemSelect={safeItemSelect} />
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
