/**
 * Story Template: Page-Level Story (with full layout)
 *
 * Use this template for full-page stories that include sidebar, header,
 * and main content area. These are useful for designer review of complete
 * page layouts and responsive behavior testing.
 *
 * Replace all {{PLACEHOLDER}} values with actual values.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { StoreDecorator } from '@/stories/storeDecorator'
// Import or create LayoutDecorator (see .storybook/decorators/LayoutDecorator.tsx)
// import { LayoutDecorator } from '@/.storybook/decorators/LayoutDecorator'
import { {{PageComponent}} } from './{{PageComponent}}'

// ============================================================================
// Mock Data
// Define comprehensive mock data for realistic page rendering
// ============================================================================

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_CHAIN_ID = '1'

const mockSafeInfo = {
  address: { value: MOCK_SAFE_ADDRESS },
  chainId: MOCK_CHAIN_ID,
  threshold: 2,
  owners: [
    { value: '0xowner1111111111111111111111111111111111' },
    { value: '0xowner2222222222222222222222222222222222' },
    { value: '0xowner3333333333333333333333333333333333' },
  ],
  nonce: 42,
  implementation: { value: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E' },
  implementationVersionState: 'UP_TO_DATE',
  modules: [],
  guard: null,
  fallbackHandler: { value: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' },
  version: '1.3.0',
}

const mockBalances = {
  fiatTotal: '12345.67',
  items: [
    {
      tokenInfo: {
        type: 'NATIVE_TOKEN',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        symbol: 'ETH',
        name: 'Ethereum',
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
      },
      balance: '1000000000000000000',
      fiatBalance: '3000.00',
      fiatConversion: '3000.00',
    },
    {
      tokenInfo: {
        type: 'ERC20',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
      },
      balance: '5000000000',
      fiatBalance: '5000.00',
      fiatConversion: '1.00',
    },
  ],
}

const mockTransactions = {
  count: 10,
  next: null,
  previous: null,
  results: [
    // Add mock transaction items as needed
  ],
}

// Initial Redux store state for page
const initialStoreState = {
  // Add minimal required store state
}

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Pages/{{PageName}}',
  component: {{PageComponent}},
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen', // Full viewport for page stories
    docs: {
      description: {
        component: '{{Brief description of the page purpose}}',
      },
    },
    // Viewport configuration for responsive testing
    viewport: {
      defaultViewport: 'responsive',
    },
    // MSW handlers for all API endpoints used by this page
    msw: {
      handlers: [
        // Safe info
        http.get('*/v1/chains/:chainId/safes/:safeAddress', () => {
          return HttpResponse.json(mockSafeInfo)
        }),
        // Balances
        http.get('*/v1/chains/:chainId/safes/:safeAddress/balances/*', () => {
          return HttpResponse.json(mockBalances)
        }),
        // Transactions
        http.get('*/v1/chains/:chainId/safes/:safeAddress/transactions/*', () => {
          return HttpResponse.json(mockTransactions)
        }),
        // Chain config
        http.get('*/v1/chains/:chainId', () => {
          return HttpResponse.json({
            chainId: MOCK_CHAIN_ID,
            chainName: 'Ethereum',
            // Add more chain config as needed
          })
        }),
      ],
    },
  },
  argTypes: {
    // Page-level props if any
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={initialStoreState}>
        {/*
          Wrap with LayoutDecorator to include sidebar and header.
          Create this decorator at .storybook/decorators/LayoutDecorator.tsx

          Example structure:
          <LayoutDecorator>
            <Sidebar />
            <Header />
            <main>
              <Story />
            </main>
          </LayoutDecorator>
        */}
        <div style={{ minHeight: '100vh', display: 'flex' }}>
          {/* Placeholder for sidebar - replace with actual LayoutDecorator */}
          <aside style={{ width: 240, background: '#f5f5f5', padding: 16 }}>
            Sidebar Placeholder
          </aside>
          <main style={{ flex: 1, padding: 24 }}>
            <Story />
          </main>
        </div>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof {{PageComponent}}>

export default meta
type Story = StoryObj<typeof meta>

// ============================================================================
// Viewport Stories (Responsive Testing)
// ============================================================================

/**
 * Desktop viewport (default)
 * Full-width display with expanded sidebar
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
    chromatic: {
      viewports: [1440], // Chromatic capture at 1440px
    },
  },
}

/**
 * Tablet viewport
 * Medium-width display, sidebar may collapse
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    chromatic: {
      viewports: [768],
    },
  },
}

/**
 * Mobile viewport
 * Narrow display with hamburger menu
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    chromatic: {
      viewports: [375],
    },
  },
}

// ============================================================================
// State Stories
// ============================================================================

/**
 * Loading state - Data being fetched
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:safeAddress', async () => {
          await new Promise((r) => setTimeout(r, 100000))
          return HttpResponse.json(mockSafeInfo)
        }),
        // Delay all other handlers too
      ],
    },
  },
}

/**
 * Error state - API failures
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:safeAddress', () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }),
      ],
    },
  },
}

/**
 * Empty state - No items/data
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:safeAddress', () => {
          return HttpResponse.json(mockSafeInfo)
        }),
        http.get('*/v1/chains/:chainId/safes/:safeAddress/balances/*', () => {
          return HttpResponse.json({ fiatTotal: '0', items: [] })
        }),
        http.get('*/v1/chains/:chainId/safes/:safeAddress/transactions/*', () => {
          return HttpResponse.json({ count: 0, results: [] })
        }),
      ],
    },
  },
}

// ============================================================================
// Theme Stories (if theme switching is relevant)
// ============================================================================

/**
 * Dark mode variant
 * (Handled by Storybook toolbar theme switcher, but can set explicitly)
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
