import { ArrowDownLeft, Repeat, ArrowUpRight, SquareDashedBottomCode } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="action" onClick={onSend}>
          <ArrowUpRight className="size-5 text-green-400" />
          Send
        </Button>
        <Button variant="outline" size="action" onClick={onReceive}>
          <ArrowDownLeft className="size-5" />
          Receive
        </Button>
        <Button variant="outline" size="action" onClick={onSwap}>
          <Repeat className="size-5" />
          Swap
        </Button>
        <Button variant="outline" size="action" onClick={onBuildTransaction}>
          <SquareDashedBottomCode className="size-5" />
          Build transaction
        </Button>
      </div>
      {otherActions}
    </div>
  )
}

export { HeaderActions }
