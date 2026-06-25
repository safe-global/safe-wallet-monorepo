import type { SafeItemData } from '@/features/spaces'

/**
 * Orders items by fiat balance (desc), current Safe pinned first, using each row's shown `balance`
 * (multi-chain = current chain). Zero/missing balances sort last; ties keep input order.
 */
export const orderItemsByBalance = (items: SafeItemData[], currentItemId: string): SafeItemData[] => {
  const current = items.find((item) => item.id === currentItemId)
  const rest = items.filter((item) => item.id !== currentItemId)
  const sorted = rest.slice().sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
  return current ? [current, ...sorted] : sorted
}
