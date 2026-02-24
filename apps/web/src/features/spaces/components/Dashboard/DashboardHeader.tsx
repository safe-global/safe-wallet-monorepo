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
  otherActions?: React.ReactNode
}

const DashboardHeader = ({
  value,
  onSend,
  onReceive,
  onSwap,
  onBuildTransaction,
  otherActions,
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col gap-6 mb-10">
      <TotalValueElement value={value} />
      <HeaderActions
        onSend={onSend}
        onReceive={onReceive}
        onSwap={onSwap}
        onBuildTransaction={onBuildTransaction}
        otherActions={otherActions}
      />
    </div>
  )
}

export { DashboardHeader }
