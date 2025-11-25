import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import RefreshPositionsButton from './index'
import { toBeHex } from 'ethers'

const SAFE_ADDRESS = toBeHex('0x1234', 20)

const meta: Meta<typeof RefreshPositionsButton> = {
  title: 'Features/Positions/RefreshPositionsButton',
  component: RefreshPositionsButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button to refresh positions data. Shows a spinning icon while loading.',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          settings: {
            currency: 'usd',
            hiddenTokens: {},
            shortName: { copy: true, qr: true },
            theme: {},
            env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
            signing: { onChainSigning: false, blindSigning: false },
            transactionExecution: true,
          },
          safeInfo: {
            data: {
              address: { value: SAFE_ADDRESS },
              chainId: '1',
              deployed: true,
            },
            loading: false,
            loaded: true,
          },
        }}
      >
        <Paper sx={{ padding: 4 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof RefreshPositionsButton>

/**
 * Icon-only refresh button (default).
 */
export const Default: Story = {
  args: {
    size: 'small',
  },
}

/**
 * Refresh button with label.
 */
export const WithLabel: Story = {
  args: {
    label: 'Refresh positions',
    size: 'small',
  },
}
