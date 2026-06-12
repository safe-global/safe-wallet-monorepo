import React, { type ReactNode, useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

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
    <div className="flex min-h-screen w-full bg-[var(--color-background-default)]">
      {showSidebar && (
        <>
          {isSidebarOpen && (
            <aside className="box-border shrink-0" style={{ width: SIDEBAR_WIDTH }}>
              <Sidebar />
            </aside>
          )}

          {/* Sidebar toggle button */}
          <button
            type="button"
            aria-label="toggle sidebar"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="fixed top-1/2 z-[1200] -translate-y-1/2 rounded-r border border-border bg-[var(--color-background-paper)] p-1 transition-[left] duration-300 hover:bg-muted"
            style={{ left: isSidebarOpen ? SIDEBAR_WIDTH : 0 }}
          >
            {isSidebarOpen ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
          </button>
        </>
      )}

      <div className="flex flex-1 flex-col">
        {showHeader && (
          <header className="sticky top-0 z-[1100]">
            <Header onMenuToggle={showSidebar ? setSidebarOpen : undefined} onBatchToggle={setBatchOpen} />
          </header>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
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
