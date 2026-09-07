import { ArrowRight, Shield, X } from 'lucide-react'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

/**
 * Sidebar card announcing that the workspace requires 2FA. Continue opens the General settings
 * page, where the two-factor section shows who is covered and how to set it up.
 */
const WorkspaceTwoFactorAwarenessCard = ({
  spaceId,
  onDismiss,
  className,
}: {
  spaceId?: string
  onDismiss: () => void
  className?: string
}) => (
  <div
    className={cn(
      'relative flex w-full flex-col items-start gap-3 rounded-lg bg-muted bg-no-repeat p-4 shadow-lg',
      css.card,
      className,
    )}
    data-testid="workspace-2fa-awareness-card"
  >
    <button
      type="button"
      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      onClick={onDismiss}
      aria-label="Dismiss"
      data-testid="workspace-2fa-awareness-dismiss"
    >
      <X className="size-4" />
    </button>

    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', css.iconChip)}>
      <Shield className="size-4" />
    </span>

    <div className="flex w-full flex-col gap-1">
      <Typography variant="paragraph-small-bold" className="text-foreground">
        Protect your Workspace with 2FA
      </Typography>
      <Typography variant="paragraph-mini" color="muted">
        A second factor is required on all sensitive actions.
      </Typography>
    </div>

    <Button
      size="xs"
      nativeButton={false}
      render={
        <NextLink href={{ pathname: AppRoutes.spaces.settingsGeneral, query: spaceId ? { spaceId } : undefined }} />
      }
      data-testid="workspace-2fa-awareness-continue"
    >
      Continue
      <ArrowRight data-icon="inline-end" />
    </Button>
  </div>
)

export default WorkspaceTwoFactorAwarenessCard
