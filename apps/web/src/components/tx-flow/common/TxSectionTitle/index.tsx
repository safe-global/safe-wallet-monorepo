import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

/**
 * Section heading inside a transaction flow step ("Note", "Sign with", "Threshold", …).
 *
 * Renders at the `paragraph-bold` scale (16px/600) — the step's own subtitle is the `h4` above it,
 * so a section inside it has to sit below that. It stays an `<h5>` element to keep the document
 * outline intact under that `h4`.
 */
const TxSectionTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Typography as="h5" variant="paragraph-bold" className={cn('flex items-center gap-2', className)}>
    {children}
  </Typography>
)

export default TxSectionTitle
