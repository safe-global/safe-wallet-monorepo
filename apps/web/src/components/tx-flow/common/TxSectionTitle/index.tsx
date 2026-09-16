import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

/**
 * Section heading inside a tx flow step ("Note", "Sign with"). An `h5` under the step's own `h4`
 * subtitle, at the `paragraph-bold` scale since shadcn has no `h5` type variant.
 */
const TxSectionTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Typography as="h5" variant="paragraph-bold" className={cn('flex items-center gap-2', className)}>
    {children}
  </Typography>
)

export default TxSectionTitle
