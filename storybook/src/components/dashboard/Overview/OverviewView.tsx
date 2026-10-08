import type { ReactElement, ReactNode } from 'react'

export type TotalAssetValueSlotProps = {
  size: 'md' | 'lg'
  title: string
}

export type OverviewViewProps = {
  renderTotalAssetValue: (props: TotalAssetValueSlotProps) => ReactNode
  refreshHint?: ReactNode
  showActions: boolean
  actionsTray: ReactNode
}

export function OverviewView({
  renderTotalAssetValue,
  refreshHint,
  showActions,
  actionsTray,
}: OverviewViewProps): ReactElement {
  return (
    <section className="overflow-hidden rounded-3xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5">
      {/* Hint pinned to the top, actions to the bottom so they line up with the balance and don't overlap the hint */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-stretch">
        <div className="flex items-end">{renderTotalAssetValue({ size: 'lg', title: 'Total balance' })}</div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          {refreshHint}

          {/* `mt-auto`, not `justify-between`: the hint above is conditional */}
          {showActions && <div className="md:mt-auto">{actionsTray}</div>}
        </div>
      </div>
    </section>
  )
}
