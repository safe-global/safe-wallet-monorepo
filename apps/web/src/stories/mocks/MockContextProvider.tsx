import React, { useEffect, type ReactNode, type ReactElement } from 'react'
import { Box, Paper } from '@mui/material'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { StoreDecorator } from '@/stories/storeDecorator'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import PageLayout from '@/components/common/PageLayout'
import type { StoryContext } from '@storybook/react'
import type { LayoutType } from './types'

/**
 * Mock TxModal context - provides no-op implementations
 */
export const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

/**
 * Mock SDK Provider - initializes empty Safe SDK for stories
 *
 * This component sets up a mock Safe SDK instance that satisfies
 * SDK checks without requiring actual blockchain connectivity.
 */
export const MockSDKProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}
MockSDKProvider.displayName = 'MockSDKProvider'

/**
 * Props for MockContextProvider component
 */
interface MockContextProviderProps {
  /** Wallet context value (connected/disconnected state) */
  wallet: WalletContextType
  /** Story content to render */
  children: ReactNode
  /** Initial Redux store state */
  initialState: object
  /** Storybook context for theme detection */
  context?: StoryContext
  /** Layout wrapper type */
  layout?: LayoutType
  /** Custom pathname for PageLayout */
  pathname?: string
}

/**
 * Layout wrapper component based on layout type
 * Uses storyId as key to force complete remount between stories,
 * ensuring MUI Drawer and router state are properly reset.
 */
function LayoutWrapper({
  layout,
  pathname,
  children,
  storyId,
}: {
  layout: LayoutType
  pathname: string
  children: ReactNode
  storyId?: string
}) {
  switch (layout) {
    case 'paper':
      return <Paper sx={{ p: 2 }}>{children}</Paper>

    case 'fullPage':
      return (
        <PageLayout key={storyId} pathname={pathname}>
          {children as ReactElement}
        </PageLayout>
      )

    case 'withSidebar':
      // Same as fullPage but could be customized in the future
      return (
        <PageLayout key={storyId} pathname={pathname}>
          {children as ReactElement}
        </PageLayout>
      )

    case 'none':
    default:
      // Mimic PageLayout's .content main { padding: var(--space-3) } rule
      return (
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            '& > main': { p: 3 },
          }}
        >
          <main>{children}</main>
        </Box>
      )
  }
}

/**
 * Unified context provider for all story mocking needs
 *
 * Provides:
 * - Mock Safe SDK
 * - Wallet context (configurable: disconnected/connected/owner)
 * - TxModal context (no-op implementation)
 * - Redux store with initial state
 * - Layout wrapper (none/paper/fullPage)
 *
 * @example
 * <MockContextProvider
 *   wallet={disconnectedWallet}
 *   initialState={createInitialState({ ... })}
 *   layout="paper"
 * >
 *   <MyComponent />
 * </MockContextProvider>
 */
export function MockContextProvider({
  wallet,
  children,
  initialState,
  context,
  layout = 'none',
  pathname = '/home',
}: MockContextProviderProps) {
  return (
    <MockSDKProvider>
      <WalletContext.Provider value={wallet}>
        <TxModalContext.Provider value={mockTxModalContext}>
          <StoreDecorator initialState={initialState} context={context}>
            <LayoutWrapper layout={layout} pathname={pathname} storyId={context?.id}>
              {children}
            </LayoutWrapper>
          </StoreDecorator>
        </TxModalContext.Provider>
      </WalletContext.Provider>
    </MockSDKProvider>
  )
}
MockContextProvider.displayName = 'MockContextProvider'
