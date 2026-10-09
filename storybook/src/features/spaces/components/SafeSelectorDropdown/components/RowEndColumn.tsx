import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

// Fixed-width, right-aligned trailing column of a safe row. The fiat balance and the
// counterfactual activation status both render inside it so the trailing slot keeps a
// constant width — this keeps the chain logos in one column and lines the status up with
// the balance across deployed and undeployed rows.
const RowEndColumn = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div
    data-testid="row-end-column"
    className={cn('flex flex-col items-end min-w-0 shrink sm:w-[100px] sm:shrink-0', className)}
  >
    {children}
  </div>
)

export default RowEndColumn
