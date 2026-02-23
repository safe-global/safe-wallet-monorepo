import { ArrowDownLeft, Repeat, ArrowUpRight, MoreVertical, SquareDashedBottomCode } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * HeaderActions
 *
 * Action button group for dashboard header: Send, Receive, Swap, Build transaction, Customize.
 * Part of Spaces Enterprise workspace design.
 *
 */

interface HeaderActionsProps {
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuildTransaction?: () => void
  onCustomize?: () => void
}

const HeaderActions = ({ onSend, onReceive, onSwap, onBuildTransaction, onCustomize }: HeaderActionsProps) => {
  const outlineClassName = 'bg-transparent border-[#d4d4d4] hover:bg-muted/50'
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" onClick={onSend}>
          <ArrowUpRight className="size-4 text-[#4ade80]" />
          Send
        </Button>
        <Button variant="outline" className={outlineClassName} onClick={onReceive}>
          <ArrowDownLeft className="size-4" />
          Receive
        </Button>
        <Button variant="outline" className={outlineClassName} onClick={onSwap}>
          <Repeat className="size-4" />
          Swap
        </Button>
        <Button variant="outline" className={outlineClassName} onClick={onBuildTransaction}>
          <SquareDashedBottomCode className="size-4" />
          Build transaction
        </Button>
      </div>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCustomize}>
        <MoreVertical className="size-4 text-foreground" />
        Customize
      </Button>
    </div>
  )
}

export { HeaderActions }
