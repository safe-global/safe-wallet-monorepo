import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ButtonGroup } from '@safe-global/views/components/ui/button-group'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useDrawerContext } from '@safe-global/views/components/common/Drawer/components/DrawerContext'

export type DrawerHeaderAction = {
  label: string
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  /** For a toggle such as "Expand all sections". */
  pressed?: boolean
  /** Shown in the tooltip. The page owns the key handling. */
  shortcut?: string
}

export type DrawerHeaderNavigation = {
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  /** Where the open item sits in its list, such as "3 of 12". Announced when it changes. */
  position?: string
}

export type DrawerHeaderProps = {
  title: ReactNode
  /** Leading visual: an icon tile, an identicon or a token mark. */
  media?: ReactNode
  /** Second line under the title. */
  subtitle?: ReactNode
  /** Takes the second line in place of the subtitle, so the drawer never says two things there. */
  status?: ReactNode
  onBack?: () => void
  navigation?: DrawerHeaderNavigation
  /** Extra icon buttons, placed in the button group before close. */
  actions?: DrawerHeaderAction[]
}

const FADE = 'linear-gradient(to right, #000 calc(100% - 32px), transparent)'

/** One line that fades out at the end, only when it doesn't fit. */
const FittedTitle = ({ children }: { children: ReactNode }): ReactElement => {
  const ref = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const measure = () => setOverflowing(element.scrollWidth > element.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  return (
    <span
      ref={ref}
      title={overflowing && typeof children === 'string' ? children : undefined}
      className="block min-w-0 overflow-hidden whitespace-nowrap"
      style={overflowing ? { maskImage: FADE, WebkitMaskImage: FADE } : undefined}
    >
      {children}
    </span>
  )
}

const HeaderButton = ({ label, icon, onClick, disabled, pressed, shortcut }: DrawerHeaderAction): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
        />
      }
    >
      {icon}
    </TooltipTrigger>
    <TooltipContent>
      {label}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </TooltipContent>
  </Tooltip>
)

/** Buttons sit in the row rather than over it, so the title always knows how much room it has. */
export const DrawerHeader = ({
  title,
  media,
  subtitle,
  status,
  onBack,
  navigation,
  actions = [],
}: DrawerHeaderProps): ReactElement => {
  const drawer = useDrawerContext()
  const registerHeader = drawer?.registerHeader

  // Layout effect, so the Drawer drops its fallback close before the first paint
  useLayoutEffect(() => registerHeader?.(), [registerHeader])

  const secondLine = status ?? subtitle
  const hasNavigation = Boolean(navigation?.onPrevious || navigation?.onNext)

  const buttons: DrawerHeaderAction[] = [
    ...(onBack ? [{ label: 'Back', icon: <ArrowLeft />, onClick: onBack }] : []),
    ...(hasNavigation
      ? [
          {
            label: 'Previous',
            icon: <ChevronUp />,
            onClick: navigation?.onPrevious,
            disabled: !navigation?.hasPrevious,
            shortcut: 'K',
          },
          {
            label: 'Next',
            icon: <ChevronDown />,
            onClick: navigation?.onNext,
            disabled: !navigation?.hasNext,
            shortcut: 'J',
          },
        ]
      : []),
    ...actions,
    ...(drawer ? [{ label: 'Close', icon: <X />, onClick: drawer.onClose }] : []),
  ]

  return (
    <header data-slot="drawer-header" className="flex items-center gap-3 px-6 pt-6">
      {media && <div className="flex shrink-0 items-center">{media}</div>}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography as="div" variant="paragraph-bold" className="min-w-0 leading-tight">
          <FittedTitle>{title}</FittedTitle>
        </Typography>
        {secondLine && (
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">{secondLine}</div>
        )}
      </div>

      {navigation?.position && (
        <span className="sr-only" aria-live="polite">
          {navigation.position}
        </span>
      )}

      {buttons.length > 0 && (
        <ButtonGroup aria-label="Drawer actions" className="shrink-0">
          {buttons.map((button) => (
            <HeaderButton key={button.label} {...button} />
          ))}
        </ButtonGroup>
      )}
    </header>
  )
}
