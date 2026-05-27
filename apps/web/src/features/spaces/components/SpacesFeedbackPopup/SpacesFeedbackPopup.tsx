import { useState, type ReactElement } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type SpacesFeedbackPopupProps = {
  name: string
  role: string
  badge: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  avatarSrc?: string
  avatarFallback?: string
  open?: boolean
  onClose?: () => void
  className?: string
}

export function SpacesFeedbackPopup({
  name,
  role,
  badge,
  title,
  description,
  ctaLabel,
  ctaHref,
  avatarSrc,
  avatarFallback,
  open,
  onClose,
  className,
}: SpacesFeedbackPopupProps): ReactElement | null {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(true)
  const isOpen = isControlled ? open : internalOpen

  if (!isOpen) return null

  const handleClose = () => {
    if (!isControlled) setInternalOpen(false)
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn('fixed right-4 bottom-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]', className)}
    >
      <Card
        size="sm"
        className="relative gap-4 rounded-2xl border border-muted-foreground/20 px-5 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)]"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground"
        >
          <X />
        </Button>

        <div className="flex items-center gap-2.5 pr-8">
          <Avatar size="sm">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Typography variant="paragraph-small">{name}</Typography>
            <Typography variant="paragraph-small" color="muted">
              {role}
            </Typography>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit text-muted-foreground">
            {badge}
          </Badge>
          <Typography variant="h4" className="font-bold leading-[26px]">
            {title}
          </Typography>
          <Typography variant="paragraph">{description}</Typography>
          <Button className="w-full" render={<a href={ctaHref} target="_blank" rel="noreferrer noopener" />}>
            <ArrowUpRight />
            {ctaLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
