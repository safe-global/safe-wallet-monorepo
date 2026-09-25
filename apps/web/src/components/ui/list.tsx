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
function List({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<'ul'> & { orientation?: 'vertical' | 'horizontal' }) {
  return (
    <ul
      className={cn('m-0 flex list-none p-0', orientation === 'horizontal' ? 'flex-row gap-4' : 'flex-col', className)}
      data-slot="list"
      data-orientation={orientation}
      {...props}
    />
  )
}

function ListItem({ className, size = 'default', ...props }: ComponentProps<'li'> & { size?: 'default' | 'sm' }) {
  return (
    <li
      className={cn('flex items-center', size === 'sm' ? 'gap-2 py-0.5' : 'gap-3 py-2', className)}
      data-slot="list-item"
      data-size={size}
      {...props}
    />
  )
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
