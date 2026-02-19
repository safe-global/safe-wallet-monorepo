import { useState, useRef, type ReactElement, type ReactNode } from 'react'
import { Card, Stack, Typography, Collapse, IconButton } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import { SidebarListItemCounter } from '@/components/sidebar/SidebarList'
import { useWarningCount } from './useWarningCount'
import css from './styles.module.css'

export interface ActionRequiredPanelProps {
  children: ReactNode
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
export const ActionRequiredPanel = ({ children }: ActionRequiredPanelProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false)
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
    <Card
      data-testid="action-required-panel"
      sx={{
        border: 0,
        px: 1.5,
        pt: 2.5,
        pb: isExpanded ? 2.5 : 1.5,
        height: 1,
        width: 1,
        display: warningCount === 0 ? 'none' : 'block',
      }}
      component="section"
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className={css.header}
        sx={{ px: 1.5, mb: 1, cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle action required panel"
      >
        <Typography fontWeight={700} className={css.headerText}>
          Action required <SidebarListItemCounter count={warningCount.toString()} variant="subtle" />
        </Typography>

        <IconButton
          size="small"
          aria-label={isExpanded ? 'Collapse action required panel' : 'Expand action required panel'}
          sx={{ ml: 1, pointerEvents: 'none' }}
        >
          <KeyboardArrowDownRoundedIcon
            className={css.chevron}
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        </IconButton>
      </Stack>

      <Collapse in={isExpanded}>
        <div ref={containerRef} className={css.warningsContainer}>
          {children}
        </div>
      </Collapse>
    </Card>
  )
}
