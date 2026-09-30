import { ActionsTray } from '@/features/actions-tray'
import { TotalValueElement } from '../TotalValueElement'

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

export { DashboardHeader }
