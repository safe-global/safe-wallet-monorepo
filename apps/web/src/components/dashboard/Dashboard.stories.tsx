import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { Box } from '@mui/material'
import { createMockStory, MockContextProvider, createChainData, createInitialState } from '@/stories/mocks'
import { getFixtureData, resolveWallet } from '@/stories/mocks'
import Dashboard from './index'

/**
 * Dashboard component story - renders the actual Dashboard content.
 *
 * This story tests the Dashboard component in isolation, without the app shell
 * (sidebar/header). The Dashboard includes:
 * - Overview widget with total balance and action buttons
 * - Assets widget showing top tokens
 * - Pending transactions list
 * - Explore Safe Apps widget
 *
 * Uses the createMockStory factory for consistent mocking across all stories.
 * All features (PORTFOLIO_ENDPOINT, POSITIONS, NATIVE_SWAPS) are enabled by default.
 */

// Default story setup - all features enabled by default
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
})

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
} satisfies Meta<typeof Dashboard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Dashboard with EF Safe data (~$73M total balance).
 * Shows real Overview, Assets, PendingTxs, and ExplorePossible widgets.
 */
export const Default: Story = {}

/**
 * Dashboard with full app layout (Header + Sidebar + Footer).
 * Shows complete page including DeFi positions widget with real fixture data.
 * Wallet is connected.
 */
export const WithLayout: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'connected',
    layout: 'fullPage',
  })
  return {
    parameters: {
      ...setup.parameters,
    },
    decorators: [setup.decorator],
  }
})()

/**
 * Dashboard with whale portfolio data (Vitalik's Safe).
 * Tests large balance rendering.
 */
export const WhalePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'vitalik',
    wallet: 'owner',
  })
  return {
    parameters: {
      ...setup.parameters,
    },
    decorators: [setup.decorator],
  }
})()

/**
 * Dashboard for a new/empty Safe with no assets.
 * Shows empty state messaging.
 */
export const EmptyDashboard: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'owner',
  })
  return {
    parameters: {
      ...setup.parameters,
    },
    decorators: [setup.decorator],
  }
})()

/**
 * Dashboard at mobile viewport width (375px).
 */
export const MobileViewport: Story = (() => {
  const { safeData } = getFixtureData('efSafe')
  const chainData = createChainData()

  return {
    parameters: {
      viewport: {
        defaultViewport: 'mobile',
      },
      ...defaultSetup.parameters,
    },
    decorators: [
      (Story, context) => {
        const isDarkMode = context.globals?.theme === 'dark'
        const wallet = resolveWallet('owner', safeData)
        const initialState = createInitialState({
          safeData,
          chainData,
          isDarkMode,
        })

        return (
          <MockContextProvider wallet={wallet} initialState={initialState} context={context} layout="none">
            <Box sx={{ maxWidth: 375 }}>
              <Story />
            </Box>
          </MockContextProvider>
        )
      },
    ],
  }
})()

/**
 * Dashboard at tablet viewport width (768px).
 */
export const TabletViewport: Story = (() => {
  const { safeData } = getFixtureData('efSafe')
  const chainData = createChainData()

  return {
    parameters: {
      viewport: {
        defaultViewport: 'tablet',
      },
      ...defaultSetup.parameters,
    },
    decorators: [
      (Story, context) => {
        const isDarkMode = context.globals?.theme === 'dark'
        const wallet = resolveWallet('owner', safeData)
        const initialState = createInitialState({
          safeData,
          chainData,
          isDarkMode,
        })

        return (
          <MockContextProvider wallet={wallet} initialState={initialState} context={context} layout="none">
            <Box sx={{ maxWidth: 768 }}>
              <Story />
            </Box>
          </MockContextProvider>
        )
      },
    ],
  }
})()
