import type { ReactNode } from 'react'
import { ListFilter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export type TxFilterPopoverViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasFilter: boolean
  filterType?: string
  filterForm: ReactNode
}

export const TxFilterPopoverView = ({
  open,
  onOpenChange,
  hasFilter,
  filterType,
  filterForm,
}: TxFilterPopoverViewProps) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <div className="relative inline-flex">
        <PopoverTrigger
          render={
            <Button variant="outline" size="action">
              <ListFilter />
              {filterType ?? 'Filter'}
            </Button>
          }
        />
        {hasFilter && (
          <span className="absolute -top-0.5 -left-0.5 size-2 rounded-full bg-[var(--color-success-main)]" />
        )}
      </div>

      <PopoverContent
        align="end"
        className="mt-1 w-[min(720px,calc(100vw-2rem))] max-w-[90vw] overflow-visible rounded-xl border border-border bg-card p-0 shadow-md ring-0"
      >
        {filterForm}
      </PopoverContent>
    </Popover>
  )
}
