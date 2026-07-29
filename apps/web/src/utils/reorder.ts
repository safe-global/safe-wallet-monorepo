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
