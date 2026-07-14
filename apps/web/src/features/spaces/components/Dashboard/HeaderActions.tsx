import { ArrowDownLeft, Repeat, ArrowUpRight, SquareDashedBottomCode } from 'lucide-react'

import { ActionBar, ActionButton } from '@/components/common/ActionBar'

/**
 * HeaderActions
 *
 * Action button group for dashboard header: Send, Receive, Swap, Build transaction.
 * Accepts an optional `otherActions` slot for trailing actions (e.g. Customize, Manage Safe).
 * Part of Spaces Enterprise workspace design.
 *
 */

interface HeaderActionsProps {
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuildTransaction?: () => void
  otherActions?: React.ReactNode
}

const HeaderActions = ({ onSend, onReceive, onSwap, onBuildTransaction, otherActions }: HeaderActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ActionBar>
        <ActionButton variant="default" onClick={onSend}>
          <ArrowUpRight className="size-5 text-green-400" />
          Send
        </ActionButton>
        <ActionButton variant="outline" onClick={onReceive}>
          <ArrowDownLeft className="size-5" />
          Receive
        </ActionButton>
        <ActionButton variant="outline" onClick={onSwap}>
          <Repeat className="size-5" />
          Swap
        </ActionButton>
        <ActionButton variant="outline" onClick={onBuildTransaction}>
          <SquareDashedBottomCode className="size-5" />
          Build transaction
        </ActionButton>
      </ActionBar>
      {otherActions}
    </div>
  )
}

export { HeaderActions }
