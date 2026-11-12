import { useEffect, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { ChevronRight, CircleAlert } from 'lucide-react'
import { Button } from '../../primitives/button/button'
import { Skeleton } from '../../primitives/skeleton/skeleton'
import { Typography } from '../../primitives/typography/typography'
import { cn } from '../../lib/utils'

interface WidgetProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode
  /** Makes the title a pointer target, e.g. to open the full list */
  onTitleClick?: () => void
  /** Trailing node in the title row, e.g. `WidgetViewAll` or an icon button */
  action?: ReactNode
}

/**
 * Widget
 *
 * A dashboard card: a title row with an optional action, then a stack of rows (`WidgetItem`), states
 * (`WidgetItemSkeleton`, `WidgetEmptyState`, `WidgetErrorState`) and an optional `WidgetFooter`.
 *
 * @example
 * ```tsx
 * <Widget title="Assets" action={<WidgetViewAll count={4} onClick={openAssets} />}>
 *   <WidgetItem label="Ether" info="12.5 ETH" startNode={<Avatar />} />
 * </Widget>
 * ```
 */
function Widget({ title, onTitleClick, action, children, className, ...props }: WidgetProps) {
  return (
    <div data-slot="widget" className={cn('flex h-full min-h-0 flex-col rounded-xl bg-card p-1', className)} {...props}>
      <div className="flex shrink-0 items-center pl-6 pr-2 justify-between pb-3 pt-6">
        <div className={cn('flex min-h-10 items-center', onTitleClick && 'cursor-pointer')} onClick={onTitleClick}>
          <Typography variant="h4">{title}</Typography>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  )
}

const enterKey = (onClick?: () => void) =>
  onClick ? (event: KeyboardEvent) => event.key === 'Enter' && onClick() : undefined

interface WidgetItemProps extends Omit<useRender.ComponentProps<'div'>, 'onClick'> {
  label: ReactNode
  info: ReactNode
  /** Optional second line that wraps, e.g. amount and recipient */
  description?: ReactNode
  /** Makes the row a button (Enter activates it) */
  onClick?: () => void
  /** Leading node, e.g. an avatar */
  startNode?: ReactNode
  /** Node before the action slot, e.g. a status badge */
  featuredNode?: ReactNode
  /** Trailing node, e.g. a value or a button */
  actionNode?: ReactNode
  /** Paints the row on the page background */
  highlighted?: boolean
  /** Gives the action slot a fixed width so values align across rows */
  fixedActionWidth?: boolean
}

function WidgetItem({
  label,
  info,
  description,
  onClick,
  startNode,
  featuredNode,
  actionNode,
  highlighted = false,
  fixedActionWidth = false,
  className,
  render,
  ...props
}: WidgetItemProps) {
  const interactive = Boolean(onClick || render)
  const isButton = Boolean(onClick && !render)

  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        role: isButton ? 'button' : undefined,
        tabIndex: isButton ? 0 : undefined,
        onClick,
        onKeyDown: isButton ? enterKey(onClick) : undefined,
        className: cn(
          'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm py-4 pl-4 pr-6',
          interactive && 'cursor-pointer transition-colors hover:bg-muted/50',
          highlighted && 'bg-background',
          className,
        ),
        children: (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {startNode}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {typeof label === 'string' ? (
                  <Typography variant="paragraph-medium" className="overflow-hidden whitespace-nowrap">
                    {label}
                  </Typography>
                ) : (
                  label
                )}
                {typeof description === 'string' ? (
                  <Typography variant="paragraph-small" color="muted" className="break-words">
                    {description}
                  </Typography>
                ) : (
                  description
                )}
                {typeof info === 'string' ? (
                  <Typography variant="paragraph-mini" color="muted" className="overflow-hidden whitespace-nowrap">
                    {info}
                  </Typography>
                ) : (
                  info
                )}
              </div>
            </div>

            {(featuredNode || actionNode) && (
              <div className="ml-auto flex shrink-0 items-center gap-4">
                {featuredNode && <div className="flex items-center justify-center">{featuredNode}</div>}
                {actionNode && (
                  <div className={cn('flex flex-col items-center gap-2', fixedActionWidth ? 'w-36' : 'min-w-16')}>
                    {actionNode}
                  </div>
                )}
              </div>
            )}
          </>
        ),
      },
      props,
    ),
    state: { slot: 'widget-item' },
  })
}

function WidgetItemSkeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="widget-item-skeleton"
      className={cn('flex items-center justify-between rounded-xl py-4 pl-4 pr-6', className)}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>

      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
  )
}

interface WidgetFooterProps extends Omit<ComponentProps<'div'>, 'onClick'> {
  text: ReactNode
  /** Overflow count shown as a `+N` pill in the leading slot */
  count?: number
  /** Makes the footer a button (Enter activates it) */
  onClick?: () => void
  /** Keeps the leading pill or spacer so the text aligns with the rows' content */
  showLeadingSlot?: boolean
}

function WidgetFooter({ count, text, className, onClick, showLeadingSlot = true, ...props }: WidgetFooterProps) {
  return (
    <div
      data-slot="widget-footer"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={enterKey(onClick)}
      className={cn(
        'mt-auto flex cursor-pointer items-center rounded-lg py-1 px-6 transition-colors hover:bg-muted/50',
        showLeadingSlot ? 'gap-4' : 'gap-0',
        !showLeadingSlot && 'min-h-10',
        className,
      )}
      {...props}
    >
      {showLeadingSlot && (
        <div className="p-1">
          {count !== undefined ? (
            <div className="flex size-8 items-center justify-center rounded-full bg-widget-count text-xs font-semibold text-widget-count-foreground">
              +{count}
            </div>
          ) : (
            <div className="size-8" />
          )}
        </div>
      )}
      <Typography variant="paragraph-small" color="muted">
        {text}
      </Typography>
    </div>
  )
}

interface WidgetViewAllProps extends ComponentProps<'div'> {
  /** Items beyond those shown, rendered as a `+N` pill before the link */
  count?: number
  onClick?: () => void
  label?: ReactNode
}

function WidgetViewAll({ count, onClick, label = 'View all', className, ...props }: WidgetViewAllProps) {
  return (
    <div data-slot="widget-view-all" className={cn('flex items-center', className)} {...props}>
      {count !== undefined && count > 0 && (
        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-primary">
          +{count}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        // eslint-disable-next-line no-restricted-syntax -- sits flush with the `+N` pill, so it drops the size's horizontal padding
        className="gap-1 px-2 font-normal text-primary"
        data-testid="widget-view-all"
      >
        {label}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

const STROKE_ANIMATION: KeyframeAnimationOptions = { duration: 800, easing: 'ease-out', delay: 200, fill: 'forwards' }

interface WidgetEmptyStateProps extends ComponentProps<'div'> {
  icon: ReactNode
  text: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** Classes for the round icon halo, e.g. another background */
  iconContainerClassName?: string
}

function WidgetEmptyState({
  icon,
  text,
  subtitle,
  action,
  className,
  iconContainerClassName,
  ...props
}: WidgetEmptyStateProps) {
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!iconRef.current) return
    iconRef.current.querySelectorAll('path, line, polyline, circle, rect').forEach((element) => {
      const shape = element as SVGGeometryElement
      if (typeof shape.getTotalLength !== 'function' || typeof shape.animate !== 'function') return
      const length = shape.getTotalLength()
      shape.style.strokeDasharray = `${length}`
      shape.style.strokeDashoffset = `${length}`
      shape.animate([{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }], STROKE_ANIMATION)
    })
  }, [])

  return (
    <div
      data-slot="widget-empty-state"
      className={cn('flex flex-1 flex-col items-center gap-4 py-10 justify-center h-fit', className)}
      {...props}
    >
      <div
        ref={iconRef}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-widget-icon-halo animate-in fade-in duration-400 ease-out',
          iconContainerClassName,
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col items-center gap-2 text-center animate-in fade-in duration-350 ease-out delay-150 fill-mode-backwards">
        <Typography variant="paragraph-bold">{text}</Typography>
        {subtitle && (
          <Typography variant="paragraph-small" color="muted">
            {subtitle}
          </Typography>
        )}
      </div>
      {action && <div className="animate-in fade-in duration-350 ease-out delay-300 fill-mode-backwards">{action}</div>}
    </div>
  )
}

interface WidgetErrorStateProps extends ComponentProps<'div'> {
  message?: ReactNode
  /** Shows the reload button */
  onRefresh?: () => void
  subtitle?: ReactNode
  reloadLabel?: ReactNode
}

function WidgetErrorState({
  message = 'Unable to load content',
  onRefresh,
  subtitle = 'Try to reload the page.',
  reloadLabel = 'Reload page',
  ...props
}: WidgetErrorStateProps) {
  return (
    <WidgetEmptyState
      icon={<CircleAlert className="size-6" />}
      text={message}
      subtitle={subtitle}
      action={
        onRefresh && (
          <Button variant="secondary" size="action" onClick={onRefresh}>
            {reloadLabel}
          </Button>
        )
      }
      {...props}
    />
  )
}

export { Widget, WidgetItem, WidgetItemSkeleton, WidgetFooter, WidgetViewAll, WidgetEmptyState, WidgetErrorState }
export type {
  WidgetProps,
  WidgetItemProps,
  WidgetFooterProps,
  WidgetViewAllProps,
  WidgetEmptyStateProps,
  WidgetErrorStateProps,
}
