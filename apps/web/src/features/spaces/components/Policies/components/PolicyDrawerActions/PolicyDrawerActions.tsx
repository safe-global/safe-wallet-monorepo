import type { ReactElement } from 'react'
import Link, { type LinkProps } from 'next/link'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

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
  <DrawerFooter>
    <div className="flex flex-col gap-2">
      {hint && (
        <Typography variant="paragraph-mini" color="muted" align="center">
          {hint}
        </Typography>
      )}

      <Button
        variant={variant}
        className="w-full"
        onClick={onClick}
        disabled={disabled}
        render={href && !disabled ? <Link href={href} /> : undefined}
      >
        {actionLabel}
      </Button>
    </div>
  </DrawerFooter>
)

export default PolicyDrawerActions

export const PolicyDrawerActionsSkeleton = (): ReactElement => (
  <DrawerFooter>
    <Skeleton className="h-9 w-full" data-testid="policy-drawer-actions-skeleton" />
  </DrawerFooter>
)
