import { useState, useRef, useEffect, type ReactElement, type ReactNode } from 'react'
import { useWarningCount } from './useWarningCount'
import { ActionRequiredPanelView } from '@views/components/dashboard/ActionRequiredPanel/ActionRequiredPanelView'

export interface ActionRequiredPanelProps {
  children: ReactNode
  /**
   * Opens the panel once when this turns true (e.g. a critical item was detected).
   * A manual user toggle always wins thereafter, so a late/again-true signal never
   * re-opens a panel the user has collapsed.
   */
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
 *   <MastercopyWarning />
 * </ActionRequiredPanel>
 * ```
 */
export const ActionRequiredPanel = ({ children, defaultExpanded = false }: ActionRequiredPanelProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false)
  const userToggledRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const warningCount = useWarningCount(containerRef)

  // Open once when a critical item is detected, unless the user has already toggled the panel.
  useEffect(() => {
    if (defaultExpanded && !userToggledRef.current) {
      setIsExpanded(true)
    }
  }, [defaultExpanded])

  const toggleExpanded = () => {
    userToggledRef.current = true
    setIsExpanded((prev) => !prev)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExpanded()
    }
  }

  return (
    <ActionRequiredPanelView
      isExpanded={isExpanded}
      onOpenChange={(open) => {
        userToggledRef.current = true
        setIsExpanded(open)
      }}
      onToggle={toggleExpanded}
      onKeyDown={handleKeyDown}
      warningCount={warningCount}
      containerRef={containerRef}
    >
      {children}
    </ActionRequiredPanelView>
  )
}
