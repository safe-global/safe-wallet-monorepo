import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'

export function SimilarityGroupContainer({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="my-1 overflow-hidden rounded-lg border border-[var(--color-warning-light)]">
      {/* Warning header */}
      <div className="bg-[var(--color-warning-background)] px-3 py-1.5">
        <Typography variant="paragraph-mini-medium" className="text-[var(--color-warning-main)]">
          Similar addresses - verify carefully
        </Typography>
      </div>

      {/* Grouped items */}
      <div className="flex flex-col gap-2 bg-[var(--color-background-paper)] p-2">{children}</div>
    </div>
  )
}
