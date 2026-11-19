import type { ReactElement } from 'react'
import Link, { type LinkProps } from 'next/link'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'

export type PolicyDrawerActionsProps = {
  actionLabel: string
  onClick?: () => void
  /** Renders the action as a link, so it can also open in a new tab. */
  href?: LinkProps['href']
  hint?: string
  variant?: 'default' | 'secondary'
  disabled?: boolean
}

const PolicyDrawerActions = ({
  actionLabel,
  onClick,
  href,
  hint,
  variant = 'default',
  disabled = false,
}: PolicyDrawerActionsProps): ReactElement => (
  <DrawerFooter hint={hint}>
    <Button
      variant={variant}
      className="w-full"
      onClick={onClick}
      disabled={disabled}
      render={href && !disabled ? <Link href={href} /> : undefined}
    >
      {actionLabel}
    </Button>
  </DrawerFooter>
)

export default PolicyDrawerActions

export const PolicyDrawerActionsSkeleton = (): ReactElement => (
  <DrawerFooter>
    <Skeleton className="h-9 w-full" data-testid="policy-drawer-actions-skeleton" />
  </DrawerFooter>
)
