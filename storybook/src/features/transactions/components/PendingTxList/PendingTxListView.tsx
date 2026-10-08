import type { ReactElement, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { SafeWidgetRoot } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetFooter } from '@views/features/spaces/components/SafeWidget/WidgetFooter'
import { WidgetItemSkeleton } from '@views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MAX_TXS = 3

export const TxIconView = ({ icon }: { icon: ReactNode }): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">{icon}</div>
)

export type PendingTxListItem = {
  id: string
  href: string
  typeText: ReactNode
  txInfo: ReactNode
  date: string
  icon: ReactNode
  status: string
}

export type PendingTxListItemSlots = {
  href: string
  label: ReactNode
  info: string
  startNode: ReactNode
  actionNode: ReactNode
}

export type PendingTxListViewProps = {
  isLoading: boolean
  recoveryItems: ReactNode
  items: PendingTxListItem[]
  queueSize: number
  onNavigate: () => void
  onViewAll: () => void
  renderItem: (key: string, slots: PendingTxListItemSlots) => ReactNode
}

export const PendingTxListView = ({
  isLoading,
  recoveryItems,
  items,
  queueSize,
  onNavigate,
  onViewAll,
  renderItem,
}: PendingTxListViewProps): ReactElement => {
  return (
    <SafeWidgetRoot
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm" onClick={onNavigate}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      {isLoading ? (
        Array.from({ length: MAX_TXS }).map((_, i) => <WidgetItemSkeleton key={i} />)
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        <>
          {recoveryItems}

          {items.map((item) => {
            return renderItem(item.id, {
              href: item.href,
              label: (
                <div className="flex gap-1 items-center">
                  {item.typeText} {item.txInfo}
                </div>
              ),
              info: item.date,
              startNode: <TxIconView icon={item.icon} />,
              actionNode: <Badge variant="secondary">{item.status}</Badge>,
            })
          })}
        </>
      )}
      {!isLoading && items.length > 0 && (
        <WidgetFooter count={queueSize} text="View all pending transactions" onClick={onViewAll} />
      )}
    </SafeWidgetRoot>
  )
}
