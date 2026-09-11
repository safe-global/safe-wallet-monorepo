import { ArrowRight, ShieldCheck, X } from 'lucide-react'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

/**
 * Sidebar card announcing that the workspace requires 2FA. Continue opens the General settings
 * page, where the two-factor section shows who is covered and how to set it up.
 *
 * Deliberately quieter than the Safe Pro sidebar banner it shares the slot with: a flat muted
 * card and a plain green chip, no glow and no wordmark.
 *
 * The two banners occupy one slot and swap places, so their parts have to line up: the spacing
 * below puts the headline 32px down and the button at the bottom edge, matching the Safe Pro
 * banner, whichever of the two wraps its copy to more lines.
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
      // The transparent border matches the Safe Pro banner's, so both measure the same in the slot they share.
      'relative flex w-full flex-col items-start rounded-lg border border-transparent bg-muted p-4 shadow-lg dark:bg-card',
      className,
    )}
    data-testid="workspace-2fa-awareness-card"
  >
    <button
      type="button"
      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      onClick={onDismiss}
      aria-label="Dismiss"
      data-testid="workspace-2fa-awareness-dismiss"
    >
      <X className="size-4" />
    </button>

    {/* 28px chip plus a 4px gap leaves the headline 32px down, where the Safe Pro banner's 20px
        chip plus its 12px gap put it. */}
    <span className="mb-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-strong">
      <ShieldCheck className="size-4" aria-hidden />
    </span>

    <div className="flex w-full flex-1 flex-col gap-1">
      <Typography variant="paragraph-small-bold" className="text-foreground">
        Protect your Workspace with 2FA
      </Typography>
      <Typography variant="paragraph-mini" color="muted">
        A second factor is required on all sensitive actions.
      </Typography>
    </div>

    <Button
      size="xs"
      className="mt-3"
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
