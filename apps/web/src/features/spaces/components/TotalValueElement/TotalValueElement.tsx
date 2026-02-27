import { Skeleton } from '@/components/ui/skeleton'

/**
 * TotalValueElement
 *
 * Presentational component displaying a "Total value" label with a formatted monetary amount.
 * Part of Spaces feature design.
 * Figma: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/Enterprise-workspace?node-id=7506-30004
 */

interface TotalValueElementProps {
  value: string
  loading?: boolean
}

const TotalValueElement = ({ value, loading }: TotalValueElementProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">Total value</span>
      {loading ? (
        <Skeleton className="h-[30px] w-48" />
      ) : (
        <span className="font-medium leading-[1] tracking-tight text-foreground text-[30px]">{value}</span>
      )}
    </div>
  )
}

export { TotalValueElement }
