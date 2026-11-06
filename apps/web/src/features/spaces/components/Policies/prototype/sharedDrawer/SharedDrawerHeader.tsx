import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, X, type LucideIcon } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@/components/common/Identicon'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { cn } from '@safe-global/views/utils/cn'
import { FullAddress } from '../m2Prototype'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'subtle'
export type HeaderStatus = { label: string; tone: StatusTone }

/** M1's PolicyStatusChip labels and colours, plus the M2 and account panel ones. */
export const STATUS = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'destructive' },
  blocked: { label: 'Blocked', tone: 'destructive' },
  notActivated: { label: 'Not activated', tone: 'destructive' },
  notProtected: { label: 'Not protected', tone: 'subtle' },
  changePending: { label: 'Change pending', tone: 'warning' },
} as const satisfies Record<string, HeaderStatus>

export type NameEnding = 'fade' | 'dots' | 'fade-dots'
export type HeaderPadding = 16 | 24
export type HeaderButtonSize = 'icon' | 'icon-sm'
export type HeaderButtonLayout = 'group' | 'separate'

export type HeaderMedia =
  | { kind: 'account'; name: string; address: string; chainId: string }
  | { kind: 'icon'; icon: LucideIcon; title: string; subtitle?: string }

export type SharedDrawerHeaderProps = {
  media: HeaderMedia
  /** Shown on the second line, in place of a subtitle. */
  status?: HeaderStatus
  nameEnding?: NameEnding
  /** Both chevrons show when either handler is passed. */
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  fullScreen?: boolean
  onToggleFullScreen?: () => void
  onClose: () => void
  padding?: HeaderPadding
  buttonSize?: HeaderButtonSize
  /** `group` is Figma's Button Group: one outline around every button, a 1px line between them. */
  buttonLayout?: HeaderButtonLayout
}

const FADES: Record<NameEnding, string | undefined> = {
  fade: 'linear-gradient(to right, #000 calc(100% - 32px), transparent)',
  'fade-dots': 'linear-gradient(to right, #000 calc(100% - 40px), transparent calc(100% - 14px))',
  dots: undefined,
}

/** One line of text that ends in a fade, dots, or both, only when it doesn't fit. */
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

const TOOLTIP_CLOSE_DELAY_MS = 150

/** Every tooltip in the panel opens like the address one: at once, and lingers 150ms on the way out. */
export const TOOLTIP_TIMING = { delay: 0, closeDelay: TOOLTIP_CLOSE_DELAY_MS }

/** M2's address tooltip, opened from the identicon (tap or keyboard too) and from the short address. */
const AccountMedia = ({
  name,
  address,
  chainId,
  ending,
  extra,
}: {
  name: string
  address: string
  chainId: string
  ending: NameEnding
  extra?: ReactNode
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef<number>(undefined)

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setIsOpen(true)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setIsOpen(false), TOOLTIP_CLOSE_DELAY_MS)
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  return (
    <>
      <Tooltip open={isOpen} onOpenChange={(next) => (next ? show() : hide())}>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Show full address"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          }
        >
          <Identicon address={address} size={36} />
        </TooltipTrigger>
        {/* The panel sits 12px from the top of the viewport, so there is never room above the identicon. */}
        <TooltipContent side="bottom" align="start" className="max-w-none" onMouseEnter={show} onMouseLeave={hide}>
          <FullAddress address={address} chainId={chainId} />
        </TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="paragraph-bold" className="min-w-0 leading-tight">
          <FittedText ending={ending}>{name}</FittedText>
        </Typography>
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-fit shrink-0" onMouseEnter={show} onMouseLeave={hide}>
            <Typography variant="paragraph-mini" color="muted" className="font-mono leading-[normal]">
              {shortenAddress(address)}
            </Typography>
          </span>
          {extra}
        </div>
      </div>
    </>
  )
}

const IconMedia = ({
  icon: Icon,
  title,
  subtitle,
  ending,
  extra,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  ending: NameEnding
  extra?: ReactNode
}): ReactElement => (
  <>
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
      aria-hidden
    >
      <Icon className="size-4" strokeWidth={ICON_STROKE} />
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <Typography variant="paragraph-bold" className="min-w-0 leading-tight">
        <FittedText ending={ending}>{title}</FittedText>
      </Typography>
      {(subtitle || extra) && (
        <div className="flex min-w-0 items-center gap-2">
          {subtitle && <p className="truncate text-xs tabular-nums text-muted-foreground">{subtitle}</p>}
          {extra}
        </div>
      )}
    </div>
  </>
)

type HeaderAction = {
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

/** Buttons sit in the header row rather than floating over it, so the title always knows how much room it has. */
export const SharedDrawerHeader = ({
  media,
  status,
  nameEnding = 'fade',
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  fullScreen = false,
  onToggleFullScreen,
  onClose,
  padding = 16,
  buttonSize = 'icon-sm',
  buttonLayout = 'group',
}: SharedDrawerHeaderProps): ReactElement => {
  const badge = status && (
    <Badge variant={status.tone} size="status" shape="status" className="shrink-0">
      <BadgeDot />
      {status.label}
    </Badge>
  )

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
        <AccountMedia
          name={media.name}
          address={media.address}
          chainId={media.chainId}
          ending={nameEnding}
          extra={badge}
        />
      ) : (
        <IconMedia
          icon={media.icon}
          title={media.title}
          subtitle={badge ? undefined : media.subtitle}
          ending={nameEnding}
          extra={badge}
        />
      )}

      <HeaderActions actions={actions} layout={buttonLayout} size={buttonSize} />
    </header>
  )
}
