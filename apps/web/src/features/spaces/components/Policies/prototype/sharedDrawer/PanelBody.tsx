import { Children, createContext, Fragment, useContext, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { DrawerSection } from '@/components/common/Drawer'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'

export type FrameStyle = 'white' | 'white-border' | 'white-shadow' | 'grey'

const FRAME_STYLES: Record<FrameStyle, string> = {
  white: 'bg-card',
  'white-border': 'bg-card border border-border',
  'white-shadow': 'bg-card shadow-xs',
  grey: 'bg-muted',
}

/** The ring that separates overlapping icons has to match the frame they sit on. */
const ICON_RINGS: Record<FrameStyle, string> = {
  white: 'ring-card',
  'white-border': 'ring-card',
  'white-shadow': 'ring-card',
  grey: 'ring-muted',
}

/** M2's ExpandableCard hover: the whole clickable area darkens a little. */
const HOVER =
  'cursor-pointer transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none'

const FrameStyleContext = createContext<FrameStyle>('white')

export const FrameStyleProvider = FrameStyleContext.Provider

const Frame = ({ className, children }: { className?: string; children: ReactNode }): ReactElement => {
  const frameStyle = useContext(FrameStyleContext)
  return <div className={cn('overflow-hidden rounded-lg', FRAME_STYLES[frameStyle], className)}>{children}</div>
}

const Chevron = ({ open }: { open: boolean }): ReactElement => {
  const Icon = open ? ChevronDown : ChevronRight
  return (
    <Icon
      aria-hidden
      className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground"
    />
  )
}

/** Inset with wrapper padding: Separator's own full width outranks a margin on the line. */
export const Divider = ({ className }: { className?: string }): ReactElement => (
  <div className={cn('px-2', className)}>
    <Separator className="bg-border/60" />
  </div>
)

/** M1's DrawerSection title over one rounded frame; rows inside are split by a line. */
export const PanelSection = ({
  title,
  rightNode,
  children,
}: {
  title: ReactNode
  rightNode?: ReactNode
  children: ReactNode
}): ReactElement => (
  <DrawerSection title={title} rightNode={rightNode}>
    <Frame className="flex w-full flex-col">
      {Children.toArray(children).map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider />}
          <div className="px-3 py-3">{row}</div>
        </Fragment>
      ))}
    </Frame>
  </DrawerSection>
)

/** With `account`, the value starts at the row's midpoint so identicons line up and long names truncate. */
export const PanelRow = ({
  label,
  account = false,
  children,
}: {
  label: ReactNode
  account?: boolean
  children: ReactNode
}): ReactElement => (
  <div className="flex min-h-8 items-center justify-between gap-2">
    <Typography variant="paragraph-small-medium" className="shrink-0">
      {label}
    </Typography>
    <Typography
      as="div"
      variant="paragraph-small"
      className={account ? 'flex w-1/2 min-w-0 shrink-0 text-left' : 'min-w-0 text-right'}
    >
      {children}
    </Typography>
  </div>
)

/** Overlapping icons for a collapsed list, ringed in the frame's colour so they read as separate. */
export const StackedIcons = ({ icons }: { icons: ReactNode[] }): ReactElement => {
  const frameStyle = useContext(FrameStyleContext)
  return (
    <span className="flex shrink-0 -space-x-2">
      {icons.map((icon, index) => (
        <span key={index} className={cn('flex rounded-full ring-2', ICON_RINGS[frameStyle])}>
          {icon}
        </span>
      ))}
    </span>
  )
}

type ExpandableCardProps = {
  summary: ReactNode
  /** Names the details for screen readers, e.g. "recipients". */
  detailsLabel: string
  items: ReactNode[]
}

/** M2's ExpandableCard in the shared frame; once open, each item gets its own frame underneath. */
export const PanelExpandableCard = ({ summary, detailsLabel, items }: ExpandableCardProps): ReactElement => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Frame>
        <CollapsibleTrigger
          aria-label={`${open ? 'Hide' : 'Show'} ${detailsLabel}`}
          className={cn('group/row flex w-full items-center gap-3 p-3 text-left', HOVER)}
        >
          {summary}
          <Chevron open={open} />
        </CollapsibleTrigger>
      </Frame>
      <CollapsibleContent>
        <div className="flex flex-col gap-1 pt-1">
          {items.map((item, index) => (
            <Frame key={index} className="flex items-center gap-3 p-3">
              {item}
            </Frame>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const PanelExpandableSection = ({
  title,
  rightNode,
  ...card
}: ExpandableCardProps & { title: ReactNode; rightNode?: ReactNode }): ReactElement => (
  <DrawerSection title={title} rightNode={rightNode}>
    <PanelExpandableCard {...card} />
  </DrawerSection>
)
