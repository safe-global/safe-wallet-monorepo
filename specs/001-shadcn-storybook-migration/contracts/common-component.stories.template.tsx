/**
 * Story Template: Common Component (with data/store dependencies)
 *
 * Use this template for components in /components/common/ or feature components
 * that require Redux state, API mocking, or other context providers.
 *
 * Replace all {{PLACEHOLDER}} values with actual values.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { StoreDecorator } from '@/stories/storeDecorator'
import { {{ComponentName}} } from './{{ComponentName}}'

// ============================================================================
// Mock Data
// Use deterministic values for consistent snapshots (no faker/random data)
// ============================================================================

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_CHAIN_ID = '1'

const mockSuccessResponse = {
  // Define mock response structure
  data: {
    // ...
  },
}

const mockEmptyResponse = {
  data: [],
}

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Common/{{ComponentName}}',
  component: {{ComponentName}},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '{{Brief description of the component purpose}}',
      },
    },
    // Default MSW handlers for all stories
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/{{endpoint}}', () => {
          return HttpResponse.json(mockSuccessResponse)
        }),
      ],
    },
  },
  argTypes: {
    // Define controls for component props
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          // Minimal Redux state needed for component
        }}
      >
        <Paper sx={{ padding: 2, minWidth: 300 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof {{ComponentName}}>

export default meta
type Story = StoryObj<typeof meta>

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state with successful data fetch
 */
export const Default: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
  },
}

/**
 * Loading state - API request pending
 * Useful for verifying loading indicators
 */
export const Loading: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/{{endpoint}}', async () => {
          // Simulate long-running request
          await new Promise((resolve) => setTimeout(resolve, 100000))
          return HttpResponse.json(mockSuccessResponse)
        }),
      ],
    },
  },
}

/**
 * Error state - API request failed
 * Useful for verifying error handling and UI
 */
export const Error: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/{{endpoint}}', () => {
          return HttpResponse.json(
            { message: 'Internal server error', code: 500 },
            { status: 500 }
          )
        }),
      ],
    },
  },
}

/**
 * Empty state - No data returned
 * Useful for verifying empty state UI
 */
export const Empty: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/{{endpoint}}', () => {
          return HttpResponse.json(mockEmptyResponse)
        }),
      ],
    },
  },
}

/**
 * Network error - Request failed to connect
 */
export const NetworkError: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/{{endpoint}}', () => {
          return HttpResponse.error()
        }),
      ],
    },
  },
}

// ============================================================================
// Additional Stories (customize as needed)
// ============================================================================

/**
 * Alternative chain configuration
 */
export const AlternativeChain: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: '137', // Polygon
  },
}

/**
 * Disabled state (if applicable)
 */
export const Disabled: Story = {
  args: {
    address: MOCK_ADDRESS,
    chainId: MOCK_CHAIN_ID,
    disabled: true,
  },
}
