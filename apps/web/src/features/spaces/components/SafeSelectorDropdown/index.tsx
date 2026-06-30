import { useEffect, useMemo, useState } from 'react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import AddSafeChooser from './components/AddSafeChooser'
import InlineRetryError from '@/components/common/InlineRetryError'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import useChains from '@/hooks/useChains'
import { getSafeSelectorClassVariants } from './utils/classVariants'
import type { SafeItemData, SafeSelectorDropdownProps } from './types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Keeps the dropdown trigger renderable when the current safe isn't in `items`.
function buildFallbackSafeItem(selectedItemId: string | undefined, chainConfigs: Chain[]): SafeItemData | null {
  if (!selectedItemId) return null
  const { prefix: chainId, address } = parsePrefixedAddress(selectedItemId)
  if (!chainId || !address) return null
  const chain = chainConfigs.find((c) => c.chainId === chainId)
  return {
    id: selectedItemId,
    name: '',
    address,
    threshold: 0,
    owners: 0,
    balance: '',
    isLoading: true,
    chains: [
      {
        chainId,
        chainName: chain?.chainName ?? '',
        chainLogoUri: chain?.chainLogoUri ?? null,
        shortName: chain?.shortName ?? '',
      },
    ],
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
  workspaceItems = items,
  localItems = items,
  hasWorkspace = true,
  workspaceName,
  isInSpaceContext = false,
  selectedItemId,
  onItemSelect,
  isLoading,
  isError,
  onRetry,
  onManageTrustedSafes = () => {},
  onSignIn = () => {},
}: SafeSelectorDropdownProps) {
  // The dropdown always has the tabs UI, so it's always openable.
  const hasDropdownContent = true
  // Force-openable so `isSingleSafe` can't hide the chevron when only one other safe exists.
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

  // "Add a Safe account" chooser lives outside the Select so it survives the dropdown closing.
  const [addSafeChooserOpen, setAddSafeChooserOpen] = useState(false)

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  const { configs: chainConfigs } = useChains()
  const fallbackSelectedItem = useMemo(
    () => (selectedItem ? null : buildFallbackSafeItem(selectedItemId, chainConfigs)),
    [selectedItem, selectedItemId, chainConfigs],
  )
  const triggerItem = selectedItem ?? fallbackSelectedItem

  if (!mounted || !triggerItem) {
    if (isError && mounted) return <InlineRetryError message="Failed to load Safe data" onRetry={onRetry} />
    return <SafeSelectorDropdownSkeleton />
  }

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
      // Deliberately not disabled: a disabled <button> blocks the inline address actions (copy,
      // explorer, env hint). Safe switching is prevented by the forced-closed `open` above instead.
    >
      <SelectTrigger
        className={cn(
          // The wrapper's overflow-hidden clips this focus-visible ring into stray top/bottom bars,
          // so suppress it — the card shows no focus ring by design (wrapper sets focus:ring-0).
          '-m-4 flex-1 border-0 shadow-none bg-transparent dark:bg-transparent py-0 pl-6 hover:bg-transparent dark:hover:bg-transparent data-[state=open]:bg-transparent focus-visible:ring-0 focus-visible:border-0 [&_[data-slot=select-value]]:pr-0 relative',
          variants.triggerClass,
          isDisabled && 'cursor-not-allowed opacity-50',
        )}
        size="default"
        iconWrapperClassName={variants.iconWrapperClass}
        // Not the native `disabled` (that would kill the nested copy/explorer buttons); aria-disabled
        // just announces the inert trigger to assistive tech while leaving descendants operable.
        aria-disabled={isDisabled || undefined}
        data-testid="open-safes-icon"
      >
        <SelectValue>
          <SafeSelectorTriggerContent selectedItem={triggerItem} selectedChainId={selectedChainId} />
        </SelectValue>
      </SelectTrigger>

      <SafeDropdownContainer
        workspaceItems={workspaceItems}
        localItems={localItems}
        hasWorkspace={hasWorkspace}
        workspaceName={workspaceName}
        isInSpaceContext={isInSpaceContext}
        selectedItemId={safeSelectValue}
        onItemSelect={safeItemSelect}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        onManageTrustedSafes={onManageTrustedSafes}
        onSignIn={onSignIn}
        onAddSafe={() => setAddSafeChooserOpen(true)}
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
      <AddSafeChooser open={addSafeChooserOpen} onOpenChange={setAddSafeChooserOpen} />
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
