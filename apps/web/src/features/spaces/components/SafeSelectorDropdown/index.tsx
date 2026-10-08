import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import SafeSelectorTriggerContent from './components/SafeSelectorTriggerContent'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import { useTopbarOverlayElevation } from '@/hooks/useTopbarElevation'
import useChains from '@/hooks/useChains'
import { getSafeSelectorClassVariants } from '@views/features/spaces/components/SafeSelectorDropdown/utils/classVariants'
import type {
  SafeItemData,
  SafeSelectorDropdownProps,
} from '@views/features/spaces/components/SafeSelectorDropdown/types'
import { SafeSelectorDropdownView } from '@views/features/spaces/components/SafeSelectorDropdown/SafeSelectorDropdownView'

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

function SafeSelectorDropdown({
  items,
  listItems,
  selectedItemId,
  onItemSelect,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
  emptyStateOverride,
  searchValue,
  onSearchValueChange,
  onItemRename,
  onReorder,
  keepOpen,
}: SafeSelectorDropdownProps) {
  const hasDropdownContent = Boolean(header) || Boolean(footer) || isLoading || isError
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

  const variants = getSafeSelectorClassVariants(isSingleSafe)
  const isPopupOpen = variants.canOpen && !isDisabled && dropdownOpen
  const safeSelectValue = selectedItemId ?? selectedItem?.id
  const safeItemSelect = onItemSelect ?? (() => {})

  // The dropdown's backdrop dims the whole page; lift the topbar above it so the trigger stays lit.
  useTopbarOverlayElevation('safe-selector', isPopupOpen)

  const { configs: chainConfigs } = useChains()
  const fallbackSelectedItem = useMemo(
    () => (selectedItem ? null : buildFallbackSafeItem(selectedItemId, chainConfigs)),
    [selectedItem, selectedItemId, chainConfigs],
  )
  const triggerItem = selectedItem ?? fallbackSelectedItem

  // A lifted search query would otherwise persist across open/close (local state resets with the popup).
  const handleOpenChangeWithReset = (open: boolean) => {
    // Ignore close requests while a modal is layered on top (e.g. renaming): base-ui tries to close
    // the popup when focus/pointer moves into the dialog, but we want the user to keep their place.
    if (!open && keepOpen) return
    if (!open) onSearchValueChange?.('')
    handleOpenChange(open)
  }

  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenOnPressRef = useRef(false)

  // The display layer sits on top of the full-bleed trigger and its tooltip triggers must keep pointer
  // events (otherwise they never open on hover), so a press on the safe name or the balance lands on a
  // <span> the trigger behind it never sees. Forward it — unless it hit one of the row's own controls,
  // or base-ui already closed the popup on this same pointerdown, in which case forwarding reopens it.
  // Capture phase is required: when the popup is open base-ui dismisses it mid-pointerdown, so by the
  // bubble phase the state already reads closed and the guard below would let the click reopen it.
  const rememberOpenStateOnPress = () => {
    wasOpenOnPressRef.current = isPopupOpen
  }

  const forwardPressToTrigger = (event: MouseEvent<HTMLDivElement>) => {
    if (wasOpenOnPressRef.current || isDisabled || !variants.canOpen) return
    if (event.target instanceof Element && event.target.closest('a, button, [role="button"]')) return
    triggerRef.current?.click()
  }

  const placeholder =
    !mounted || !triggerItem
      ? isError && mounted
        ? 'error'
        : 'skeleton'
      : items.length === 0
        ? isError
          ? 'error'
          : 'skeleton'
        : undefined

  return (
    <SafeSelectorDropdownView
      placeholder={placeholder}
      onRetry={onRetry}
      isDisabled={isDisabled}
      variants={variants}
      value={safeSelectValue}
      onValueChange={handleSafeChange}
      open={isPopupOpen}
      onOpenChange={isDisabled ? undefined : handleOpenChangeWithReset}
      triggerRef={triggerRef}
      triggerAddress={triggerItem?.address ?? ''}
      onPointerDownCapture={rememberOpenStateOnPress}
      onDisplayClick={forwardPressToTrigger}
      triggerContent={
        triggerItem && <SafeSelectorTriggerContent selectedItem={triggerItem} selectedChainId={selectedChainId} />
      }
      dropdown={
        <SafeDropdownContainer
          items={listItems ?? items}
          selectedItemId={safeSelectValue}
          onItemSelect={safeItemSelect}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          header={header}
          footer={footer}
          emptyStateOverride={emptyStateOverride}
          closeDropdown={closeDropdown}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
          onItemRename={onItemRename}
          onReorder={onReorder}
        />
      }
    />
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
