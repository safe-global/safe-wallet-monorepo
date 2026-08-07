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
 * Weave a reordered movable subset back into the full key list: `isFixed` keys keep their original
 * slots (display-only hoisting must not rewrite their persisted positions), the rest fill in order.
 *
 * Total against caller drift (a drop can be reported against a stale snapshot of the list): the
 * output is always a permutation of `allKeys` — duplicate, unknown, and now-fixed entries are
 * dropped, and movable keys the reorder never mentioned fill the remaining slots in stored order.
 */
export const weaveReorderedKeys = (
  allKeys: string[],
  reorderedMovableKeys: string[],
  isFixed: (key: string) => boolean,
): string[] => {
  const movable = new Set(allKeys.filter((key) => !isFixed(key)))
  const queue = [...new Set(reorderedMovableKeys)].filter((key) => movable.has(key))
  const queued = new Set(queue)
  queue.push(...allKeys.filter((key) => movable.has(key) && !queued.has(key)))
  let slot = 0
  return allKeys.map((key) => (isFixed(key) ? key : queue[slot++]))
}
