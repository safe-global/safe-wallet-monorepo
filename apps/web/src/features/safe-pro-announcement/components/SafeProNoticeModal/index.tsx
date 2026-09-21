import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import SafeProModalFrame from '../SafeProModalFrame'

/**
 * Hero, headline, one paragraph and one button: the notice a member sees when only an admin can act on the
 * Workspace. Without `onOpenChange` the notice cannot be dismissed (a locked Workspace).
 */
const SafeProNoticeModal = ({
  open,
  title,
  body,
  actionLabel = 'Go to My accounts',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onOpenChange,
}: {
  open: boolean
  title: ReactNode
  body: string
  actionLabel?: string
  onAction: () => void
  /** An optional primary alternative next to the action, e.g. "Try again". */
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  onOpenChange?: (open: boolean) => void
}) => {
  const hasSecondary = Boolean(secondaryActionLabel && onSecondaryAction)

  return (
    <SafeProModalFrame open={open} onOpenChange={onOpenChange} showCloseButton={Boolean(onOpenChange)}>
      <div className="flex flex-col gap-3">
        <Typography variant="h4" as={DialogTitle}>
          {title}
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          {body}
        </Typography>
      </div>

      <div className={cn('flex gap-3', hasSecondary && 'w-full')}>
        <Button variant="secondary" className={cn(hasSecondary && 'flex-1')} onClick={onAction}>
          {actionLabel}
        </Button>
        {hasSecondary && (
          <Button className="flex-1" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </SafeProModalFrame>
  )
}

export default SafeProNoticeModal
