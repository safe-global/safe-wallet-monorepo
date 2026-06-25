import type { SafeItemData } from '@/features/spaces'

/**
 * Orders dropdown items by fiat balance, highest first, with the current Safe
 * pinned to the front (mirrors the Name / Last visited behaviour). Uses the same
 * `balance` shown on the row (single-chain = that chain; multi-chain = current
 * chain). Zero, missing, or still-loading balances ('0' / '') sort last; ties keep input order.
 */
export const orderItemsByBalance = (items: SafeItemData[], currentItemId: string): SafeItemData[] => {
  const current = items.find((item) => item.id === currentItemId)
  const rest = items.filter((item) => item.id !== currentItemId)
  const sorted = rest.slice().sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
  return current ? [current, ...sorted] : sorted
}
