import type { ReactElement } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PendingTransaction {
  id: string
  label: string
  info: string
  status: string
  initials?: string
}

interface PendingTxWidgetProps {
  transactions: PendingTransaction[]
  remainingCount?: number
  onViewAll?: () => void
  onNavigate?: () => void
}

const TxIcon = (): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <ArrowUpRight className="size-5 text-foreground" />
  </div>
)

const PendingTxWidget = ({
  transactions,
  remainingCount,
  onViewAll,
  onNavigate,
}: PendingTxWidgetProps): ReactElement => {
  return (
    <SafeWidget
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm" onClick={onNavigate}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      {transactions.map((tx) => (
        <SafeWidget.Item
          key={tx.id}
          label={tx.label}
          info={tx.info}
          startNode={<TxIcon />}
          featuredNode={
            tx.initials ? (
              <Avatar size="xs">
                <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">{tx.initials}</AvatarFallback>
              </Avatar>
            ) : undefined
          }
          actionNode={<Badge variant="secondary">{tx.status}</Badge>}
        />
      ))}
      {remainingCount !== undefined && (
        <SafeWidget.Footer count={remainingCount} text="View all pending transactions" onClick={onViewAll} />
      )}
    </SafeWidget>
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps, PendingTransaction }
export default PendingTxWidget
