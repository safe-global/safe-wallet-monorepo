import React, { type ReactNode, useState } from 'react'
import { Box, Drawer, IconButton } from '@mui/material'
import DoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import DoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'

import Sidebar from '@/components/sidebar/Sidebar'
import Header from '@/components/common/Header'

/** Sidebar width matching the real app (230px) */
const SIDEBAR_WIDTH = 230

export type LayoutDecoratorProps = {
  children: ReactNode
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether to show the header */
  showHeader?: boolean
}

/**
 * LayoutDecorator wraps stories with the real Safe{Wallet} layout including
 * the actual Sidebar and Header components.
 *
 * This is designed for page-level stories where you want to see how
 * content renders within the full application context.
 *
 * Prerequisites: Stories using this decorator must provide the necessary context:
 * - StoreDecorator with safeInfo, chains, settings
 * - WalletContext.Provider for wallet state
 * - TxModalContext.Provider for transaction flow
 * - MSW handlers for API calls
 *
 * @example
 * ```tsx
 * // In your story with full context setup
 * export const WithLayout: Story = {
 *   decorators: [
 *     (Story) => (
 *       <WalletContext.Provider value={mockWallet}>
 *         <TxModalContext.Provider value={mockTxModal}>
 *           <StoreDecorator initialState={{...}}>
 *             <Story />
 *           </StoreDecorator>
 *         </TxModalContext.Provider>
 *       </WalletContext.Provider>
 *     ),
 *     withLayout(),
 *   ],
 * }
 * ```
 */
export const LayoutDecorator = ({ children, showSidebar = true, showHeader = true }: LayoutDecoratorProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [, setBatchOpen] = useState(false)

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'background.default',
      }}
    >
      {showSidebar && (
        <>
          <Drawer
            variant="persistent"
            anchor="left"
            open={isSidebarOpen}
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: SIDEBAR_WIDTH,
                boxSizing: 'border-box',
              },
            }}
          >
            <aside>
              <Sidebar />
            </aside>
          </Drawer>

          {/* Sidebar toggle button */}
          <Box
            sx={{
              position: 'fixed',
              left: isSidebarOpen ? SIDEBAR_WIDTH : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1200,
              transition: 'left 0.3s ease',
            }}
          >
            <IconButton
              aria-label="toggle sidebar"
              size="small"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              sx={{
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: '0 4px 4px 0',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {isSidebarOpen ? <DoubleArrowLeftIcon fontSize="inherit" /> : <DoubleArrowRightIcon fontSize="inherit" />}
            </IconButton>
          </Box>
        </>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // Note: No marginLeft needed - the persistent Drawer with flexShrink: 0
          // already takes its width in the flex layout, pushing this content box
          transition: 'margin-left 0.3s ease',
        }}
      >
        {showHeader && (
          <Box
            component="header"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1100,
            }}
          >
            <Header onMenuToggle={showSidebar ? setSidebarOpen : undefined} onBatchToggle={setBatchOpen} />
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Storybook decorator function for wrapping stories with the real layout.
 *
 * @example
 * ```tsx
 * // Use in story decorators array
 * export const Default: Story = {
 *   decorators: [withLayout()],
 * }
 *
 * // Or apply globally in meta
 * const meta = {
 *   decorators: [withLayout({ showHeader: true, showSidebar: true })],
 * }
 * ```
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
