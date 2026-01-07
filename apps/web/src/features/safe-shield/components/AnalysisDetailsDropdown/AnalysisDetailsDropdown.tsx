import type { ReactNode } from 'react'
import { useReducer } from 'react'
import { Box, Typography, Collapse } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'

interface AnalysisDetailsDropdownProps {
  showLabel?: string
  hideLabel?: string
  children: ReactNode
  defaultExpanded?: boolean
  /** Optional content wrapper for custom styles for the collapsible content */
  contentWrapper?: (children: ReactNode) => ReactNode
}

export const AnalysisDetailsDropdown = ({
  showLabel = 'Show all',
  hideLabel = 'Hide all',
  children,
  defaultExpanded = false,
  contentWrapper,
}: AnalysisDetailsDropdownProps) => {
  const [expanded, toggle] = useReducer((state: boolean) => !state, defaultExpanded)

  return (
    <Box mt={-1.5}>
      <Box
        onClick={toggle}
        role="button"
        aria-label={expanded ? hideLabel : showLabel}
        display="inline-flex"
        alignItems="center"
        position="relative"
        width="fit-content"
        overflow="hidden"
        color="text.secondary"
        mb={expanded ? 0.5 : 0}
        sx={{
          cursor: 'pointer',
          '&:hover div': { width: '100%', transform: 'translateX(100%)', transition: 'all 0.5s' },
        }}
      >
        <Typography fontSize={12} component="span" letterSpacing="1px" variant="body2" color="text.secondary">
          {expanded ? hideLabel : showLabel}
        </Typography>
        <Box
          position="absolute"
          left={0}
          bottom={0}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            width: 0,
            transform: 'translateX(-1rem)',
            height: '1px',
          }}
        />
        <ExpandMore
          sx={{
            transform: expanded ? 'rotate(-180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
          fontSize="small"
        />
      </Box>

      <Collapse in={expanded}>{contentWrapper ? contentWrapper(children) : children}</Collapse>
    </Box>
  )
}
