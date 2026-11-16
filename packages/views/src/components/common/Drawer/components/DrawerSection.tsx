import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'

type DrawerSectionProps = {
  title: ReactNode
  rightNode?: ReactNode
  children?: ReactNode
  /** Makes the title a toggle that shows and hides the content. Default: off. */
  collapsible?: boolean
  /** Uncontrolled initial state when `collapsible`. */
  defaultOpen?: boolean
  /** Controlled state when `collapsible`. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Title = ({ children }: { children: ReactNode }) => (
  <Typography variant="paragraph-mini-bold" color="muted" className="uppercase">
    {children}
  </Typography>
)

const RightNode = ({ children }: { children: ReactNode }) => (
  <Typography variant="paragraph-small" color="muted" className="shrink-0">
    {children}
  </Typography>
)

export const DrawerSection = ({
  title,
  rightNode,
  children,
  collapsible = false,
  defaultOpen = true,
  open,
  onOpenChange,
}: DrawerSectionProps): ReactElement => {
  if (!collapsible)
    return (
      <section className="flex w-full flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Title>{title}</Title>
          {rightNode !== undefined && <RightNode>{rightNode}</RightNode>}
        </div>
        {children}
      </section>
    )
  return (
    <Collapsible
      render={<section />}
      className="group/drawer-section flex w-full flex-col gap-2"
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger className="-mx-1 flex min-h-6 flex-1 cursor-pointer items-center gap-1 rounded-sm px-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Title>{title}</Title>
          <ChevronDown
            className="size-3.5 text-muted-foreground transition-transform group-data-[closed]/drawer-section:-rotate-90"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        {rightNode !== undefined && <RightNode>{rightNode}</RightNode>}
      </div>
      <CollapsibleContent className="flex flex-col gap-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}
