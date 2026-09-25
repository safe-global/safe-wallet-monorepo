import type { ReactNode } from 'react'
import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import SafeProModalFrame from '../SafeProModalFrame'

/** Without `onOpenChange` the notice cannot be dismissed (a locked Workspace). */
const SafeProNoticeModal = ({
  open,
  title,
  body,
  actionLabel = 'Go to My accounts',
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  onOpenChange,
}: {
  open: boolean
  title: ReactNode
  body: string
  actionLabel?: string
  onAction: () => void
  /** An optional primary alternative next to the action, e.g. "Try again", or a way out when given `secondaryActionHref`. */
  secondaryActionLabel?: string
  secondaryActionHref?: LinkProps['href']
  onSecondaryAction?: () => void
  onOpenChange?: (open: boolean) => void
}) => {
  const hasSecondary = Boolean(secondaryActionLabel && (onSecondaryAction || secondaryActionHref))

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
          <Button
            className="flex-1"
            accentIcon={Boolean(secondaryActionHref)}
            render={secondaryActionHref ? <NextLink href={secondaryActionHref} /> : undefined}
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
            {secondaryActionHref && <ArrowRight data-icon="inline-end" />}
          </Button>
        )}
      </div>
    </SafeProModalFrame>
  )
}

export default SafeProNoticeModal
