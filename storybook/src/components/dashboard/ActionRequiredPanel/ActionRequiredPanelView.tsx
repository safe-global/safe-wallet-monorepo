import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

import { PanelCounter } from '@/components/dashboard/PanelCounter'
import classnames from 'classnames'
import css from './styles.module.css'

export type ActionRequiredPanelViewProps = {
  isExpanded: boolean
  onOpenChange: (open: boolean) => void
  onToggle: () => void
  onKeyDown: (event: KeyboardEvent) => void
  warningCount: number
  containerRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function ActionRequiredPanelView({
  isExpanded,
  onOpenChange,
  onToggle,
  onKeyDown,
  warningCount,
  containerRef,
  children,
}: ActionRequiredPanelViewProps): ReactElement {
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onOpenChange}
      data-testid="action-required-panel"
      render={<section />}
      className={classnames(
        'h-full w-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pt-5 lg:px-3',
        isExpanded ? 'pb-5' : 'pb-3',
        { hidden: warningCount === 0 },
      )}
    >
      <div
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className={classnames(css.header, 'mb-2 flex flex-row items-center justify-between px-3')}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle action required panel"
        data-testid="action-required-panel-toggle"
      >
        <Typography variant="paragraph-bold" className={css.headerText}>
          Action required <PanelCounter count={warningCount.toString()} variant="subtle" />
        </Typography>

        <Button
          variant="ghost"
          size="icon-sm"
          className="pointer-events-none ml-2"
          aria-label={isExpanded ? 'Collapse action required panel' : 'Expand action required panel'}
        >
          <ChevronDown
            className={classnames(css.chevron, 'transition-transform duration-200 ease-in-out', {
              'rotate-180': isExpanded,
            })}
          />
        </Button>
      </div>

      <CollapsibleContent
        keepMounted
        className="data-[ending-style]:h-0 data-[starting-style]:h-0 h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-in-out"
      >
        <div ref={containerRef} className={css.warningsContainer} data-testid="action-required-panel-content">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
