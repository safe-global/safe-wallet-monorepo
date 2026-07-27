/**
 * Immutably moves the item at `from` to `to` and returns the resulting list of keys (in display
 * order). Shared by the drag-and-drop reorderable lists (safe-selector dropdown, accounts table),
 * which persist their order as an array of Safe addresses.
 */
export const reorderByKey = <T>(items: T[], from: number, to: number, getKey: (item: T) => string): string[] => {
  const next = Array.from(items)
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next.map(getKey)
}

/**
 * Weave a reordered movable subset back into the full key list: keys matching `isFixed` keep their
 * original slots, the remaining slots are filled from `reorderedMovableKeys` in order. Use when part
 * of a list is hoisted for display only (e.g. similarity clusters pinned on top) — the fixed keys'
 * persisted positions must survive a drag untouched.
 */
export const weaveReorderedKeys = (
  allKeys: string[],
  reorderedMovableKeys: string[],
  isFixed: (key: string) => boolean,
): string[] => {
  const queue = [...reorderedMovableKeys]
  return allKeys.map((key) => (isFixed(key) ? key : (queue.shift() ?? key)))
}
