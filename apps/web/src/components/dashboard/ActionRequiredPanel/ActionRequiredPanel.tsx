import { useState, useRef, type ReactElement, type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

import { SidebarListItemCounter } from '@/components/sidebar/SidebarList'
import classnames from 'classnames'
import { useWarningCount } from './useWarningCount'
import css from './styles.module.css'

export interface ActionRequiredPanelProps {
  children: ReactNode
  defaultExpanded?: boolean
}

/**
 * Collapsible panel that displays warning banners and attention items on the dashboard
 *
 * Features:
 * - Displays a badge with count of active warnings
 * - Collapsible with chevron icon
 * - Default state: collapsed
 * - No state persistence (resets on page load)
 * - Hidden when no warnings are present
 *
 * Usage:
 * ```tsx
 * <ActionRequiredPanel>
 *   <RecoveryHeader />
 *   <InconsistentSignerSetupWarning />
 *   <UnsupportedMastercopyWarning />
 * </ActionRequiredPanel>
 * ```
 */
export const ActionRequiredPanel = ({ children, defaultExpanded = false }: ActionRequiredPanelProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const containerRef = useRef<HTMLDivElement>(null)
  const warningCount = useWarningCount(containerRef)

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExpanded()
    }
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      data-testid="action-required-panel"
      render={<section />}
      className={classnames(
        'h-full w-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pt-5 lg:px-3',
        isExpanded ? 'pb-5' : 'pb-3',
        { hidden: warningCount === 0 },
      )}
    >
      <div
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className={classnames(css.header, 'mb-2 flex flex-row items-center justify-between px-3')}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle action required panel"
        data-testid="action-required-panel-toggle"
      >
        <Typography variant="paragraph-bold" className={css.headerText}>
          Action required <SidebarListItemCounter count={warningCount.toString()} variant="subtle" />
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
