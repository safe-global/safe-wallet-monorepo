import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import cardTableCss from '@/components/common/EnhancedTable/cardTable.module.css'

/**
 * Borderless, rounded card for tables — the single source of truth for the
 * "table inside a card" look used by the Address Book, the Spaces Team list,
 * and the Spaces contacts list.
 *
 * It renders the card chrome (`bg-card rounded-lg p-4`, no border) and applies
 * the shared in-card table polish (padded row/header edges, no header divider,
 * hover rows, borderless last row) to any `EnhancedTable` or shadcn `Table`
 * rendered inside. Change the card appearance here to update every table page
 * at once.
 */
const TableCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('bg-card rounded-lg p-4', className)}>
    <div className={cardTableCss.container}>{children}</div>
  </div>
)

export default TableCard
