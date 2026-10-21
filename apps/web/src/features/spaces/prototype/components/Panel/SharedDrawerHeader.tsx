// Ported from #9133 Policies/prototype/sharedDrawer; keep names and props in sync.
import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, X, type LucideIcon } from 'lucide-react'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { cn } from '@safe-global/views/utils/cn'
import { IdentityRow } from '../ReviewDrawer/steps/IdentityRow'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'subtle'
export type HeaderStatus = { label: string; tone: StatusTone }

export type NameEnding = 'fade' | 'dots' | 'fade-dots'
export type HeaderPadding = 16 | 24
export type HeaderButtonSize = 'icon' | 'icon-sm'
export type HeaderButtonLayout = 'group' | 'separate'

export type HeaderMedia =
  | { kind: 'account'; name: string; address: string; chainId: string }
  // `iconHint` wraps the icon in a tooltip, e.g. what a transaction type means.
  | { kind: 'icon'; icon: LucideIcon; title: string; subtitle?: ReactNode; iconHint?: ReactNode }

export type SharedDrawerHeaderProps = {
  media: HeaderMedia
  status?: HeaderStatus
  // Queue: a status element with its own tooltip, shown next to the subtitle rather than in its place.
  statusSlot?: ReactNode
  nameEnding?: NameEnding
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  // Queue: "3 of 12", read out on step and shown in full screen.
  position?: { index: number; count: number }
  fullScreen?: boolean
  onToggleFullScreen?: () => void
  onClose: () => void
  padding?: HeaderPadding
  buttonSize?: HeaderButtonSize
  buttonLayout?: HeaderButtonLayout
  // Queue: extra buttons before full screen, e.g. expand or collapse every section.
  extraActions?: HeaderAction[]
}

const FADES: Record<NameEnding, string | undefined> = {
  fade: 'linear-gradient(to right, #000 calc(100% - 32px), transparent)',
  'fade-dots': 'linear-gradient(to right, #000 calc(100% - 40px), transparent calc(100% - 14px))',
  dots: undefined,
}

const FittedText = ({ children, ending }: { children: ReactNode; ending: NameEnding }): ReactElement => {
  const ref = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setOverflowing(element.scrollWidth > element.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  const mask = overflowing ? FADES[ending] : undefined

  return (
    <span className="relative flex min-w-0">
      <span
        ref={ref}
        className={cn('block min-w-0 overflow-hidden whitespace-nowrap', ending === 'dots' && 'text-ellipsis')}
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      >
        {children}
      </span>
      {ending === 'fade-dots' && overflowing && (
        <span aria-hidden className="absolute right-0 bottom-0">
          …
        </span>
      )}
    </span>
  )
}

export const TOOLTIP_TIMING = { delay: 0, closeDelay: 150 }

const IconMedia = ({
  icon: Icon,
  iconHint,
  title,
  subtitle,
  ending,
  extra,
}: {
  icon: LucideIcon
  iconHint?: ReactNode
  title: string
  subtitle?: ReactNode
  ending: NameEnding
  extra?: ReactNode
}): ReactElement => {
  const tile =
    'flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground'
  const icon = <Icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
  return (
    <>
      {iconHint ? (
        <Tooltip {...TOOLTIP_TIMING}>
          <TooltipTrigger render={<span className={tile} role="img" aria-label={title} />}>{icon}</TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-normal">{iconHint}</TooltipContent>
        </Tooltip>
      ) : (
        <span className={tile} aria-hidden>
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography as="h2" variant="paragraph-bold" className="min-w-0 leading-tight">
          <FittedText ending={ending}>{title}</FittedText>
        </Typography>
        {(subtitle || extra) && (
          <div className="flex min-w-0 items-center gap-2">
            {subtitle && (
              <span className="flex min-w-0 items-center gap-1.5 truncate text-xs tabular-nums text-muted-foreground">
                {subtitle}
              </span>
            )}
            {extra}
          </div>
        )}
      </div>
    </>
  )
}

export type HeaderAction = {
  id: string
  label: string
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  pressed?: boolean
  shortcut?: string
}

const ActionButton = ({
  action,
  variant,
  size,
}: {
  action: HeaderAction
  variant: 'ghost' | 'surface'
  size: HeaderButtonSize
}): ReactElement => {
  const buttonProps = {
    variant,
    size,
    'aria-label': action.label,
    'aria-pressed': action.pressed,
    disabled: action.disabled,
    onClick: action.onClick,
  }

  if (!action.shortcut) return <Button {...buttonProps}>{action.icon}</Button>

  return (
    <Tooltip {...TOOLTIP_TIMING}>
      <TooltipTrigger render={<Button {...buttonProps} />}>{action.icon}</TooltipTrigger>
      <TooltipContent>
        {action.label} <Kbd>{action.shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

const HeaderActions = ({
  actions,
  layout,
  size,
}: {
  actions: HeaderAction[]
  layout: HeaderButtonLayout
  size: HeaderButtonSize
}): ReactElement => {
  if (layout === 'separate') {
    return (
      <div className={cn('flex shrink-0 items-center', size === 'icon' ? 'gap-2' : 'gap-1.5')}>
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} variant="surface" size={size} />
        ))}
      </div>
    )
  }

  return (
    <div
      data-slot="button-group"
      role="group"
      aria-label="Panel actions"
      className="flex shrink-0 items-stretch overflow-hidden rounded-md border border-border bg-card shadow-xs"
    >
      {actions.map((action, index) => (
        <span key={action.id} className="flex items-stretch">
          {index > 0 && <span aria-hidden className="w-px bg-border" />}
          <ActionButton action={action} variant="ghost" size={size} />
        </span>
      ))}
    </div>
  )
}

export const SharedDrawerHeader = ({
  media,
  status,
  statusSlot,
  nameEnding = 'fade',
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  position,
  fullScreen = false,
  onToggleFullScreen,
  onClose,
  padding = 16,
  buttonSize = 'icon-sm',
  buttonLayout = 'group',
  extraActions = [],
}: SharedDrawerHeaderProps): ReactElement => {
  const badge =
    statusSlot ??
    (status && (
      <Badge variant={status.tone} size="status" shape="status" className="shrink-0">
        <BadgeDot />
        {status.label}
      </Badge>
    ))

  const actions: HeaderAction[] = [
    ...(onPrevious || onNext
      ? [
          {
            id: 'previous',
            label: 'Previous',
            icon: <ChevronUp />,
            onClick: onPrevious,
            disabled: !hasPrevious,
            shortcut: 'K',
          },
          { id: 'next', label: 'Next', icon: <ChevronDown />, onClick: onNext, disabled: !hasNext, shortcut: 'J' },
        ]
      : []),
    ...extraActions,
    ...(onToggleFullScreen
      ? [
          {
            id: 'expand',
            label: fullScreen ? 'Restore panel' : 'Expand to full screen',
            icon: fullScreen ? <Minimize2 /> : <Maximize2 />,
            onClick: onToggleFullScreen,
            pressed: fullScreen,
          },
        ]
      : []),
    { id: 'close', label: 'Close', icon: <X />, onClick: onClose },
  ]

  return (
    <header className={cn('flex items-center gap-3', padding === 16 ? 'px-4 pt-4' : 'px-6 pt-6')}>
      {media.kind === 'account' ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IdentityRow name={media.name} address={media.address} chainId={media.chainId} avatarSize={36} />
          {badge}
        </div>
      ) : (
        <IconMedia
          icon={media.icon}
          iconHint={media.iconHint}
          title={media.title}
          // Hers drops the subtitle when a status shows; the queue needs both.
          subtitle={media.subtitle}
          ending={nameEnding}
          extra={badge}
        />
      )}

      {position && position.index >= 0 && (
        <span
          className={cn('shrink-0 text-xs tabular-nums text-muted-foreground', !fullScreen && 'sr-only')}
          aria-live="polite"
        >
          {position.index + 1} of {position.count}
        </span>
      )}
      <HeaderActions actions={actions} layout={buttonLayout} size={buttonSize} />
    </header>
  )
}
