import { TotalValueElement } from '@/features/spaces/components/TotalValueElement'

import { HeaderActions } from './HeaderActions'

/**
 * DashboardHeader
 *
 * Dashboard header with Total value display and primary action buttons.
 * Part of Spaces Enterprise workspace design.
 * Figma: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/Enterprise-workspace?node-id=7524-19551
 */

interface DashboardHeaderProps {
  value: string
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuildTransaction?: () => void
  onCustomize?: () => void
}

const DashboardHeader = ({
  value,
  onSend,
  onReceive,
  onSwap,
  onBuildTransaction,
  onCustomize,
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col gap-6">
      <TotalValueElement value={value} />
      <HeaderActions
        onSend={onSend}
        onReceive={onReceive}
        onSwap={onSwap}
        onBuildTransaction={onBuildTransaction}
        onCustomize={onCustomize}
      />
    </div>
  )
}

export { DashboardHeader }
