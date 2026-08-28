import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Rounded card surface for tables — the "table inside a card" look used by the Address Book,
 * the Spaces Team list and the Spaces contacts list.
 *
 * It draws the surface only. The table inside brings its own edge insets (the shared panel look:
 * grey header bar, inset hover pills, row dividers), so the card must not pad them in a second
 * time — anything else rendered here (empty states, notices) carries its own padding.
 */
const TableCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('bg-card rounded-lg pb-2', className)}>{children}</div>
)

export default TableCard
