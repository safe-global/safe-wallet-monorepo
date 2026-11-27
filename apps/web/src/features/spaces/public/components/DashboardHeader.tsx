import ActionsTray from '@/features/actions-tray/public/components/ActionsTray'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { TotalValueElement } from '@safe-global/views/features/spaces/components/TotalValueElement'

/**
 * DashboardHeader
 *
 * Dashboard header with Total value display and primary action buttons.
 * Part of Spaces Enterprise workspace design.
 * Figma: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/Enterprise-workspace?node-id=7524-19551
 */

interface DashboardHeaderProps {
  value: string
  loading?: boolean
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuildTransaction?: () => void
  otherActions?: React.ReactNode
  noAssets: boolean
}

const DashboardHeader = ({ value, loading, noAssets }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col gap-6 mb-10">
      <TotalValueElement value={value} loading={loading} />
      <ActionsTray noAssets={noAssets} variant="space" />
    </div>
  )
}

/** Same size as DashboardHeader. bg-border: the default muted fill matches the page background and does not show */
const DashboardHeaderSkeleton = () => {
  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-20 bg-border" />
        <Skeleton className="h-[30px] w-[200px] bg-border" />
      </div>
      <Skeleton className="h-9 w-[400px] bg-border" />
    </div>
  )
}

export { DashboardHeader, DashboardHeaderSkeleton }
