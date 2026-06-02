import { useEffect, useMemo, useState } from 'react'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import InlineRetryError from '@/components/common/InlineRetryError'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import { getSafeSelectorClassVariants } from './utils/classVariants'
import type { SafeItemData, SafeSelectorDropdownProps } from './types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Builds a minimal trigger item from `${chainId}:${address}` so the dropdown stays usable
// when the current safe isn't in `items` (e.g. safe-info load failure, navigated to a safe
// outside the current space). Balance/threshold/owners stay in their loading state — we
// don't know them. Returns null if the id isn't parseable.
function buildFallbackSafeItem(selectedItemId: string | undefined): SafeItemData | null {
  if (!selectedItemId) return null
  const colonIndex = selectedItemId.indexOf(':')
  if (colonIndex <= 0) return null
  return {
    id: selectedItemId,
    name: '',
    address: selectedItemId.slice(colonIndex + 1),
    threshold: 0,
    owners: 0,
    balance: '',
    isLoading: true,
    chains: [{ chainId: selectedItemId.slice(0, colonIndex), chainName: '', chainLogoUri: null, shortName: '' }],
  }
}

function SafeSelectorDropdownSkeleton() {
  return (
    <div className="w-full sm:w-[430px] min-h-[calc(68px)] flex items-center gap-4 rounded-lg p-2 pl-6 bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
      <div className="flex flex-col items-end gap-1.5 pr-12">
        <Skeleton className="h-4 w-16 rounded-full" />
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
  // When items are loaded but none match `selectedItemId`, we'll render a fallback trigger;
  // force the dropdown openable so the user can switch even if items has just one entry.
  const willUseFallbackTrigger =
    items.length > 0 && Boolean(selectedItemId) && !items.some((item) => item.id === selectedItemId)
  const isDisabled = useIsSafeBarControlDisabled()
  const {
    dropdownOpen,
    selectedChainId,
    selectedItem,
    isSingleSafe,
    handleOpenChange,
    handleSafeChange,
    closeDropdown,
  } = useSafeSelectorState({
    items,
    selectedItemId,
    onItemSelect,
    forceOpenable: hasDropdownContent || willUseFallbackTrigger,
  })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  // When items are loaded but no entry matches `selectedItemId` (current safe failed to
  // load, or navigated outside the current space), keep the dropdown usable by rendering
  // a degraded trigger built from the URL's `${chainId}:${address}`.
  const fallbackSelectedItem = useMemo(
    () => (selectedItem ? null : buildFallbackSafeItem(selectedItemId)),
    [selectedItem, selectedItemId],
  )
  const triggerItem = selectedItem ?? fallbackSelectedItem

  if (!mounted || !triggerItem) {
    if (isError && mounted) return <InlineRetryError message="Failed to load Safe data" onRetry={onRetry} />
    return <SafeSelectorDropdownSkeleton />
  }

  // Items haven't arrived yet — surface the load error / skeleton instead of an empty
  // dropdown that can't switch anywhere.
  if (items.length === 0) {
    if (isError) return <InlineRetryError message="Failed to load Safe data" onRetry={onRetry} />
    return <SafeSelectorDropdownSkeleton />
  }

  const selectElement = (
    <Select
      value={safeSelectValue}
      onValueChange={handleSafeChange}
      open={variants.canOpen && !isDisabled ? dropdownOpen : false}
      onOpenChange={isDisabled ? undefined : handleOpenChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        className={cn(
          '-m-4 flex-1 border-0 shadow-none bg-transparent dark:bg-transparent py-0 pl-6 hover:bg-transparent dark:hover:bg-transparent data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0 relative',
          variants.triggerClass,
          isDisabled && 'cursor-not-allowed opacity-50',
        )}
        size="default"
        iconWrapperClassName={variants.iconWrapperClass}
        data-testid="open-safes-icon"
      >
        <SelectValue>
          <SafeSelectorTriggerContent selectedItem={triggerItem} selectedChainId={selectedChainId} />
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
  )

  // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
  const wrapperClassName = cn(
    'group relative w-full sm:w-[430px] min-h-[calc(68px)] flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg p-2 overflow-hidden bg-card focus:ring-0',
    variants.wrapperClass,
  )

  const innerContent = (
    <>
      <div className="pointer-events-none absolute inset-1 rounded-md bg-muted/30 opacity-0 group-hover:opacity-100" />
      {selectElement}
    </>
  )

  if (isDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div data-testid="space-safes-navigation-block" className={wrapperClassName} />}>
          {innerContent}
        </TooltipTrigger>
        <TooltipContent side="bottom">Changing the Safe is not allowed in this screen</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div data-testid="space-safes-navigation-block" className={wrapperClassName}>
      {innerContent}
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
