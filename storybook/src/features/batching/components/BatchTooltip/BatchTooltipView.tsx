import { type ReactElement, useRef } from 'react'
import { CircleCheck } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'

export type BatchTooltipViewProps = {
  children: ReactElement
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Renders via portal so it escapes the topbar's stacking context and layers above any open tx modal.
export const BatchTooltipView = ({ children, open, onOpenChange }: BatchTooltipViewProps) => {
  const anchorRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={anchorRef}>{children}</div>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverContent anchor={anchorRef} side="bottom" align="center" sideOffset={8} className="w-auto p-4">
          <div className="flex flex-col items-center gap-2">
            <CircleCheck className="size-[53px] text-[var(--color-success-main)]" />
            <span className="text-base font-bold whitespace-nowrap">Transaction is added to batch</span>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
