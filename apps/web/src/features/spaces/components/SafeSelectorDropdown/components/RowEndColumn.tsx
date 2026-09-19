import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

// Fixed-width, right-aligned trailing column of a safe row holding the fiat balance and activation status.
// The constant width keeps chain logos in one column and aligns status with balance across all rows.
const RowEndColumn = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div
    data-testid="row-end-column"
    className={cn('flex flex-col items-end min-w-0 shrink sm:w-[100px] sm:shrink-0', className)}
  >
    {children}
  </div>
)

export default RowEndColumn
