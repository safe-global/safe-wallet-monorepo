import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'

/** A hint explains the action or why it's disabled. */
export const DrawerFooter = ({ hint, children }: { hint?: ReactNode; children?: ReactNode }): ReactElement => (
  <div className="flex flex-col gap-2 border-t border-border px-6 pt-4 pb-6">
    {hint && (
      <Typography variant="paragraph-mini" color="muted" align="center">
        {hint}
      </Typography>
    )}
    {children}
  </div>
)
