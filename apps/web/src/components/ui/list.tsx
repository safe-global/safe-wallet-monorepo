import { type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/utils/cn'

/**
 * List primitives
 *
 * Semantic list primitives aligned with the Safe{Wallet} design system. Replace MUI's
 * `List`, `ListItem`, and `ListItemText`.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem>
 *     <ListItemText primary="Owner" secondary="0x123…abc" />
 *   </ListItem>
 * </List>
 * ```
 */
function List({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn('m-0 flex list-none flex-col p-0', className)} data-slot="list" {...props} />
}

function ListItem({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cn('flex items-center gap-3 py-2', className)} data-slot="list-item" {...props} />
}

function ListItemText({
  primary,
  secondary,
  className,
}: {
  primary: ReactNode
  secondary?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)} data-slot="list-item-text">
      <span className="truncate text-sm text-foreground">{primary}</span>
      {secondary != null && <span className="truncate text-xs text-muted-foreground">{secondary}</span>}
    </div>
  )
}

export { List, ListItem, ListItemText }
