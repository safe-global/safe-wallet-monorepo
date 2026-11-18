import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'

type DrawerFooterProps = {
  /** Sits above the actions with its own divider, such as `DrawerSignatures`. */
  summary?: ReactNode
  /** Explains the action, or why it's disabled. */
  hint?: ReactNode
  children?: ReactNode
}

/** Pinned under the body, with a divider above. */
export const DrawerFooter = ({ summary, hint, children }: DrawerFooterProps): ReactElement => (
  <div className="flex flex-col gap-2 border-t border-border px-6 pt-4 pb-6">
    {summary && <div className="mb-2 border-b border-border pb-4">{summary}</div>}
    {hint && (
      <Typography variant="paragraph-mini" color="muted" align="center">
        {hint}
      </Typography>
    )}
    {children}
  </div>
)
