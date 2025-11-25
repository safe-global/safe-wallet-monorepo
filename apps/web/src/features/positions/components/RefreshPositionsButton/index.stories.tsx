import type { Meta, StoryObj } from '@storybook/react'
import type { ButtonProps } from '@mui/material'
import { Paper, Stack, Typography } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import RefreshPositionsButton from './index'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { toBeHex } from 'ethers'

const SAFE_ADDRESS = toBeHex('0x1234', 20)

interface StoryArgs {
  entryPoint?: string
  tooltip?: string
  label?: string
  size?: ButtonProps['size']
  disabled?: boolean
  hasPortfolioEndpoint?: boolean
}

const meta: Meta<StoryArgs> = {
  title: 'Features/Positions/RefreshPositionsButton',
  component: RefreshPositionsButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const args = context.args as StoryArgs
      const hasPortfolioEndpoint = args.hasPortfolioEndpoint ?? false
      const features = hasPortfolioEndpoint ? [FEATURES.PORTFOLIO_ENDPOINT, FEATURES.STAKING] : [FEATURES.STAKING]

      return (
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
            chains: {
              data: [{ chainId: '1', features }],
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
      )
    },
  ],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Button label (empty shows icon-only button)',
    },
    tooltip: {
      control: { type: 'text' },
      description: 'Custom tooltip text',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    hasPortfolioEndpoint: {
      control: { type: 'boolean' },
      description: 'Whether portfolio endpoint is enabled',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<StoryArgs>

/**
 * Icon-only refresh button (default).
 */
export const IconOnly: Story = {
  args: {
    label: '',
    size: 'small',
    hasPortfolioEndpoint: false,
  },
}

/**
 * Refresh button with label.
 */
export const WithLabel: Story = {
  args: {
    label: 'Refresh positions',
    size: 'small',
    hasPortfolioEndpoint: false,
  },
}

/**
 * Medium-sized refresh button.
 */
export const MediumSize: Story = {
  args: {
    label: 'Refresh',
    size: 'medium',
    hasPortfolioEndpoint: false,
  },
}

/**
 * Disabled refresh button.
 */
export const Disabled: Story = {
  args: {
    label: 'Refresh positions',
    size: 'small',
    disabled: true,
    hasPortfolioEndpoint: false,
  },
}

/**
 * Refresh button with custom tooltip.
 */
export const CustomTooltip: Story = {
  args: {
    label: '',
    tooltip: 'Click to refresh your portfolio data',
    size: 'small',
    hasPortfolioEndpoint: false,
  },
}

/**
 * Refresh button with portfolio endpoint enabled (changes default tooltip).
 */
export const WithPortfolioEndpoint: Story = {
  args: {
    label: '',
    size: 'small',
    hasPortfolioEndpoint: true,
  },
}

/**
 * All button variants side by side.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          Icon only:
        </Typography>
        <RefreshPositionsButton />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          With label:
        </Typography>
        <RefreshPositionsButton label="Refresh" />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          Medium:
        </Typography>
        <RefreshPositionsButton label="Refresh positions" size="medium" />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          Disabled:
        </Typography>
        <RefreshPositionsButton label="Refresh" disabled />
      </Stack>
    </Stack>
  ),
  args: {
    hasPortfolioEndpoint: false,
  },
}
