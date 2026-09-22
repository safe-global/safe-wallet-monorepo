import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

export type ProposerActionsProps = {
  actionLabel: string
  onClick: () => void
  hint?: string
  variant?: 'default' | 'secondary'
  disabled?: boolean
}

const ProposerActions = ({
  actionLabel,
  onClick,
  hint,
  variant = 'default',
  disabled = false,
}: ProposerActionsProps): ReactElement => (
  <DrawerFooter>
    <div className="flex flex-col gap-2">
      {hint && (
        <Typography variant="paragraph-mini" color="muted" align="center">
          {hint}
        </Typography>
      )}

      <Button variant={variant} className="w-full" onClick={onClick} disabled={disabled}>
        {actionLabel}
      </Button>
    </div>
  </DrawerFooter>
)

export default ProposerActions

export const ProposerActionsSkeleton = (): ReactElement => (
  <DrawerFooter>
    <Skeleton className="h-9 w-full" data-testid="proposer-actions-skeleton" />
  </DrawerFooter>
)
