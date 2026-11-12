import { useRef, type ComponentProps, type MouseEvent, type ReactNode } from 'react'
import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import { Typography } from '../../primitives/typography/typography'
import { cn } from '../../lib/utils'

/**
 * ExpandableList
 *
 * A stack of separate card rows, each with an optional tone bar, leading icon, title, trailing node and a
 * chevron that reveals an inset body. Several rows can be open at once by default. Built on the Base UI
 * accordion, so it has its keyboard model and ARIA wiring.
 *
 * @example
 * ```tsx
 * <ExpandableList>
 *   <ExpandableListGroup header={<Badge>Needs attention · 1</Badge>}>
 *     <ExpandableListItem value="recovery" tone="warning" title="No recovery set up">
 *       Add a recovery method so the account stays accessible.
 *     </ExpandableListItem>
 *   </ExpandableListGroup>
 * </ExpandableList>
 * ```
 */
function ExpandableList({ className, multiple = true, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="expandable-list"
      multiple={multiple}
      className={cn('flex flex-col gap-1 has-[>[data-slot=expandable-list-group]]:gap-0', className)}
      {...props}
    />
  )
}

interface ExpandableListGroupProps extends ComponentProps<'div'> {
  /** Shown above the group's rows, e.g. a status chip with a count */
  header?: ReactNode
}

function ExpandableListGroup({ header, children, className, ...props }: ExpandableListGroupProps) {
  return (
    <div data-slot="expandable-list-group" className={className} {...props}>
      {header && <div className="mb-2">{header}</div>}
      <div className="mb-6 flex flex-col gap-1">{children}</div>
    </div>
  )
}

const toneVariants = cva('w-1 shrink-0 self-stretch rounded-full', {
  variants: {
    tone: {
      none: 'hidden',
      critical: 'bg-tone-critical',
      warning: 'bg-tone-warning',
      attention: 'bg-tone-attention',
      success: 'bg-tone-success',
      neutral: 'bg-tone-neutral',
      muted: 'bg-tone-muted',
    },
  },
  defaultVariants: { tone: 'none' },
})

interface ExpandableListItemProps
  extends Omit<AccordionPrimitive.Item.Props, 'title' | 'children'>, VariantProps<typeof toneVariants> {
  title: ReactNode
  /** Leading node, e.g. a status icon */
  leading?: ReactNode
  /** Node before the chevron, e.g. a count button; it sits beside the row's trigger, not inside it */
  trailing?: ReactNode
  /** First line of the body, in the muted mini style */
  description?: ReactNode
  /** The body; a row without a body or description has no chevron and does not open */
  children?: ReactNode
}

const bodyLine = 'block leading-normal'

const OWN_CLICKS =
  '[data-slot=expandable-list-trigger], [data-slot=expandable-list-trailing], [data-slot=expandable-list-panel]'

function ExpandableListItem({
  title,
  leading,
  trailing,
  tone,
  description,
  children,
  className,
  ...props
}: ExpandableListItemProps) {
  const expandable = Boolean(children || description)
  const triggerRef = useRef<HTMLElement>(null)
  // The row's padding, gaps and chevron toggle it too; the trailing node and the body keep their own clicks
  const clickOutsideTrigger = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as Element).closest(OWN_CLICKS)) triggerRef.current?.click()
  }
  const label = (
    <>
      {tone && tone !== 'none' && (
        <span aria-hidden data-slot="expandable-list-tone" className={toneVariants({ tone })} />
      )}
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}
      <Typography
        variant="paragraph-small"
        className="min-w-0 flex-1 truncate"
        title={typeof title === 'string' ? title : undefined}
      >
        {title}
      </Typography>
    </>
  )
  const trailingNode = trailing && (
    <div data-slot="expandable-list-trailing" className="contents">
      {trailing}
    </div>
  )

  return (
    <AccordionPrimitive.Item
      data-slot="expandable-list-item"
      className={cn('group/expandable-list-item overflow-hidden rounded-lg bg-card', className)}
      {...props}
    >
      <div
        className={cn('px-5 py-2', expandable ? 'cursor-pointer hover:bg-secondary-hover' : 'cursor-default')}
        onClick={expandable ? clickOutsideTrigger : undefined}
      >
        {expandable ? (
          <AccordionPrimitive.Header className="m-0 flex items-center gap-2.5 py-2.5">
            <AccordionPrimitive.Trigger
              ref={triggerRef}
              data-slot="expandable-list-trigger"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 self-stretch text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {label}
            </AccordionPrimitive.Trigger>
            {trailingNode}
            <ChevronDown
              aria-hidden
              className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform group-data-[open]/expandable-list-item:rotate-180"
            />
          </AccordionPrimitive.Header>
        ) : (
          <div className="flex items-center gap-2.5 py-2.5">
            {label}
            {trailingNode}
          </div>
        )}
        {expandable && (
          <AccordionPrimitive.Panel
            data-slot="expandable-list-panel"
            className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-200 data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex flex-col gap-1.5 py-3 px-5 rounded-md bg-muted my-2">
              {description && (
                <Typography variant="paragraph-mini" color="muted" className={bodyLine}>
                  {description}
                </Typography>
              )}
              {typeof children === 'string' ? (
                <Typography variant="paragraph-mini" color="muted" className={bodyLine}>
                  {children}
                </Typography>
              ) : (
                children
              )}
            </div>
          </AccordionPrimitive.Panel>
        )}
      </div>
    </AccordionPrimitive.Item>
  )
}

export { ExpandableList, ExpandableListGroup, ExpandableListItem, toneVariants as expandableListToneVariants }
export type { ExpandableListGroupProps, ExpandableListItemProps }
