import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'

/**
 * Returns the pluralized "X safe(s) selected" label for the manage mode header.
 */
export function getSelectedCountLabel(selectedCount: number): string {
  return `${selectedCount} ${selectedCount === 1 ? 'safe' : 'safes'} selected`
}

/**
 * Returns the "+X more nested safe(s) found" indicator text.
 */
export function getUncuratedCountLabel(uncuratedCount: number): string {
  return `+${uncuratedCount} more nested ${uncuratedCount === 1 ? 'safe' : 'safes'} found`
}

/**
 * Returns the correct popover paper width string based on whether manage mode is active.
 */
export function getPopoverWidth(isManageMode: boolean): string {
  return isManageMode ? 'min(750px, calc(100vw - 32px))' : 'min(420px, calc(100vw - 32px))'
}

/**
 * Determines which set of safes to display: all safes in manage mode, visible safes otherwise.
 */
export function getSafesToShow(
  isManageMode: boolean,
  allSafesWithStatus: NestedSafeWithStatus[],
  visibleSafes: NestedSafeWithStatus[],
): NestedSafeWithStatus[] {
  return isManageMode ? allSafesWithStatus : visibleSafes
}

/**
 * Calculates the count of safes that are detected but not yet curated (hidden from view).
 */
export function getUncuratedCount(rawNestedSafes: string[], visibleSafes: NestedSafeWithStatus[]): number {
  return rawNestedSafes.length - visibleSafes.length
}

/**
 * Determines whether the current session is a first-time curation flow
 * (safes exist on-chain but the user has not yet curated their selection).
 */
export function getIsFirstTimeCuration(hasCompletedCuration: boolean, rawNestedSafes: string[]): boolean {
  return !hasCompletedCuration && rawNestedSafes.length > 0
}

/**
 * Determines whether manage mode should be active.
 */
export function getIsManageMode(
  userRequestedManage: boolean,
  isFirstTimeCuration: boolean,
  showIntro: boolean,
): boolean {
  return userRequestedManage || (isFirstTimeCuration && !showIntro)
}
