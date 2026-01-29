import React, { type ReactNode } from 'react'
import { Box } from '@mui/material'

type LayoutDecoratorProps = {
  children: ReactNode
  /** Whether to show the sidebar placeholder */
  showSidebar?: boolean
  /** Whether to show the header placeholder */
  showHeader?: boolean
}

/**
 * LayoutDecorator wraps stories with a full-page layout including
 * sidebar and header placeholders for page-level story testing.
 *
 * For actual page stories, this will be enhanced to use real
 * sidebar and header components once they have proper story coverage.
 */
export const LayoutDecorator = ({ children, showSidebar = true, showHeader = true }: LayoutDecoratorProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {showSidebar && (
        <Box
          component="aside"
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            p: 2,
          }}
        >
          {/* Sidebar placeholder - will be replaced with actual Sidebar component */}
          <Box sx={{ color: 'text.secondary', fontSize: 14 }}>Sidebar</Box>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showHeader && (
          <Box
            component="header"
            sx={{
              height: 64,
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              px: 3,
            }}
          >
            {/* Header placeholder - will be replaced with actual Header component */}
            <Box sx={{ color: 'text.secondary', fontSize: 14 }}>Header</Box>
          </Box>
        )}

        <Box component="main" sx={{ flex: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Storybook decorator function for wrapping stories with layout
 */
export const withLayout = (options?: Omit<LayoutDecoratorProps, 'children'>) => {
  const LayoutWrapper = (Story: React.ComponentType) => (
    <LayoutDecorator {...options}>
      <Story />
    </LayoutDecorator>
  )
  LayoutWrapper.displayName = 'LayoutWrapper'
  return LayoutWrapper
}
